/**
 * Recommendation engine for adaptive learning.
 *
 * Generates 4 types of recommendations based on concept mastery:
 *   1. Review  — concepts where mastery < 50 (weak)
 *   2. Prerequisite gap — advanced concepts attempted while prereqs are weak
 *   3. Skip — phases where all concepts are strong (mastery ≥ 75)
 *   4. Next best — highest-value unmastered concept with prerequisites met
 */
import { getThemedPhases } from "@/lib/exercises/loader";
import { getAdminPool } from "@/lib/db/pool";
import type { ThemeId } from "@/content/themes/types";
import type { Phase } from "@/lib/exercises/types";
import { computeConceptMastery } from "./mastery";
import { getPrerequisites } from "./prerequisites";
import type { ConceptMastery, Recommendation, RecommendationsResponse } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Index mastery scores by concept name */
function indexByName(
  masteries: readonly ConceptMastery[]
): ReadonlyMap<string, ConceptMastery> {
  return new Map(masteries.map((m) => [m.concept, m]));
}

/** Get the first exercise in a phase that belongs to a given concept */
function findExerciseForConcept(
  phases: readonly Phase[],
  concept: string
): { exerciseId: string; title: string; phase: string } | null {
  for (const phase of phases) {
    for (const ex of phase.exercises) {
      if (ex.concept === concept) {
        return { exerciseId: ex.id, title: ex.title, phase: phase.id };
      }
    }
  }
  return null;
}

/** Check entry assessment score for a phase */
async function getEntryAssessmentScore(
  userId: number,
  phaseId: string
): Promise<number | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT ar.score_pct
     FROM assessment_results ar
     JOIN assessments a ON a.id = ar.assessment_id
     WHERE ar.user_id = $1
       AND a.phase_id = $2
       AND a.assessment_type = 'entry'
     ORDER BY ar.completed_at DESC
     LIMIT 1`,
    [userId, phaseId]
  );
  if (result.rows.length === 0) return null;
  return (result.rows[0] as Record<string, unknown>).score_pct as number;
}

// ---------------------------------------------------------------------------
// Recommendation generators
// ---------------------------------------------------------------------------

function generateReviewRecommendations(
  masteries: readonly ConceptMastery[],
  phases: readonly Phase[],
  index: ReadonlyMap<string, ConceptMastery>
): readonly Recommendation[] {
  const weak = masteries.filter(
    (m) => m.level === "weak" && m.completedCount > 0
  );

  return weak
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .flatMap((m) => {
      const ex = findExerciseForConcept(phases, m.concept);
      if (!ex) return [];
      return [
        {
          type: "review" as const,
          concept: m.concept,
          phase: ex.phase,
          exerciseId: ex.exerciseId,
          title: ex.title,
          reason: `You used multiple attempts on ${m.completedCount}/${m.exerciseCount} exercises`,
          masteryScore: m.score,
        },
      ];
    });
}

function generatePrerequisiteGapRecommendations(
  masteries: readonly ConceptMastery[],
  phases: readonly Phase[],
  index: ReadonlyMap<string, ConceptMastery>
): readonly Recommendation[] {
  const recs: Recommendation[] = [];

  for (const mastery of masteries) {
    // Only check concepts the user is currently working on (developing or weak but attempted)
    if (mastery.level !== "developing" && mastery.level !== "weak") continue;
    if (mastery.completedCount === 0) continue;

    const prereqs = getPrerequisites(mastery.concept);
    for (const prereq of prereqs) {
      const prereqMastery = index.get(prereq);
      if (prereqMastery && prereqMastery.level === "weak") {
        const ex = findExerciseForConcept(phases, prereq);
        if (!ex) continue;
        recs.push({
          type: "prerequisite-gap",
          concept: prereq,
          phase: ex.phase,
          exerciseId: ex.exerciseId,
          title: ex.title,
          reason: `Strengthen ${prereq} before tackling ${mastery.concept}`,
          masteryScore: prereqMastery.score,
        });
      }
    }
  }

  // Deduplicate by concept and take top 2
  const seen = new Set<string>();
  return recs.filter((r) => {
    if (seen.has(r.concept)) return false;
    seen.add(r.concept);
    return true;
  }).slice(0, 2);
}

async function generateSkipRecommendations(
  userId: number,
  masteries: readonly ConceptMastery[],
  phases: readonly Phase[],
  index: ReadonlyMap<string, ConceptMastery>
): Promise<readonly Recommendation[]> {
  const recs: Recommendation[] = [];

  for (const phase of phases) {
    // Get all concepts in this phase
    const phaseConcepts = new Set(
      phase.exercises.map((e) => e.concept)
    );

    // Check if all concepts in phase are strong
    const allStrong = [...phaseConcepts].every((c) => {
      const m = index.get(c);
      return m && m.level === "strong";
    });

    if (!allStrong) {
      // Also check entry assessment ≥ 80%
      const entryScore = await getEntryAssessmentScore(userId, phase.id);
      if (!entryScore || entryScore < 80) continue;

      // Entry assessment is high but user hasn't done exercises — recommend skip
      const hasAttempted = [...phaseConcepts].some((c) => {
        const m = index.get(c);
        return m && m.completedCount > 0;
      });
      if (hasAttempted) continue;
    }

    if (allStrong) {
      // Only add skip if the phase actually has exercises not yet done
      const firstExercise = phase.exercises[0];
      if (!firstExercise) continue;

      recs.push({
        type: "skip",
        concept: `${phase.title}`,
        phase: phase.id,
        exerciseId: firstExercise.id,
        title: phase.title,
        reason: allStrong
          ? "All concepts mastered"
          : "Entry assessment score ≥ 80%",
        masteryScore: allStrong ? 100 : 80,
      });
    }
  }

  return recs.slice(0, 2);
}

function generateNextBestRecommendation(
  masteries: readonly ConceptMastery[],
  phases: readonly Phase[],
  index: ReadonlyMap<string, ConceptMastery>,
  completedExerciseIds: ReadonlySet<string>
): Recommendation | null {
  // Find the first concept that:
  // 1. Has unfinished exercises
  // 2. All prerequisites are "developing" or "strong"
  // 3. Is not already strong itself
  for (const phase of phases) {
    for (const exercise of phase.exercises) {
      if (completedExerciseIds.has(exercise.id)) continue;
      // Worked examples have no validation gate — skip them
      if (exercise.mode === "worked-example") continue;

      const conceptMastery = index.get(exercise.concept);
      if (conceptMastery && conceptMastery.level === "strong") continue;

      // Check prerequisites
      const prereqs = getPrerequisites(exercise.concept);
      const prereqsMet = prereqs.every((p) => {
        const pm = index.get(p);
        return pm && (pm.level === "developing" || pm.level === "strong");
      });

      if (prereqsMet) {
        return {
          type: "next-best",
          concept: exercise.concept,
          phase: phase.id,
          exerciseId: exercise.id,
          title: exercise.title,
          reason: prereqs.length > 0
            ? "Prerequisites met"
            : "Ready to start",
          masteryScore: conceptMastery?.score ?? 0,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate all recommendations for a user.
 */
export async function generateRecommendations(
  userId: number,
  themeId: ThemeId
): Promise<RecommendationsResponse> {
  const phases = getThemedPhases(themeId);
  const masteries = await computeConceptMastery(userId, themeId);
  const index = indexByName(masteries);

  // Get completed exercises for "next best" logic
  const pool = getAdminPool();
  const completedResult = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [userId]
  );
  const completedIds = new Set(
    completedResult.rows.map((r: Record<string, unknown>) => r.exercise_id as string)
  );

  // Generate all recommendation types in parallel where possible
  const [reviews, prereqGaps, skips] = await Promise.all([
    Promise.resolve(generateReviewRecommendations(masteries, phases, index)),
    Promise.resolve(generatePrerequisiteGapRecommendations(masteries, phases, index)),
    generateSkipRecommendations(userId, masteries, phases, index),
  ]);

  const nextBest = generateNextBestRecommendation(
    masteries,
    phases,
    index,
    completedIds
  );

  // Combine and prioritize: prerequisite gaps > review > skip > next best
  const recommendations: Recommendation[] = [
    ...prereqGaps,
    ...reviews,
    ...skips,
    ...(nextBest ? [nextBest] : []),
  ];

  // Limit to 5 total recommendations
  const limited = recommendations.slice(0, 5);

  // The "next exercise" is the next-best recommendation's exercise
  const nextExerciseId = nextBest?.exerciseId ?? null;

  return { recommendations: limited, nextExerciseId };
}
