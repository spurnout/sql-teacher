/**
 * Concept mastery scoring engine.
 *
 * Computes a 0–100 mastery score for each concept by combining signals from:
 *   - Exercise attempt data (attempts, hints, pass/fail)
 *   - Solution views
 *   - Exit assessment scores (phase-level bonus)
 *
 * Concepts are derived from Exercise.concept fields across all phases.
 */
import { getAdminPool } from "@/lib/db/pool";
import { getThemedPhases } from "@/lib/exercises/loader";
import type { ThemeId } from "@/content/themes/types";
import type { Exercise, Phase } from "@/lib/exercises/types";
import { getAttemptSummaries } from "./queries";
import type { ConceptMastery, ExerciseAttemptSummary, MasteryLevel } from "./types";

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const SCORE_PERFECT = 45;          // 1 attempt, 0 hints
const SCORE_GOOD = 35;             // 1 attempt, 1+ hints
const SCORE_OK = 25;               // 2-3 attempts, 0 hints
const SCORE_OK_HINTS = 15;         // 2-3 attempts, 1+ hints
const SCORE_STRUGGLED = 10;        // 4+ attempts
const SCORE_SOLUTION_VIEW = 5;     // completed after viewing solution
const SCORE_EXIT_BONUS = 15;       // exit assessment ≥ 70%
const MASTERY_CAP = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyLevel(score: number): MasteryLevel {
  if (score >= 75) return "strong";
  if (score >= 50) return "developing";
  if (score > 0) return "weak";
  return "unknown";
}

/**
 * Score a single exercise based on attempt data.
 */
function scoreExercise(summary: ExerciseAttemptSummary): number {
  if (!summary.passed) return 0;

  let score: number;

  if (summary.totalAttempts === 1) {
    score = summary.hintsUsed === 0 ? SCORE_PERFECT : SCORE_GOOD;
  } else if (summary.totalAttempts <= 3) {
    score = summary.hintsUsed === 0 ? SCORE_OK : SCORE_OK_HINTS;
  } else {
    score = SCORE_STRUGGLED;
  }

  // Penalty for viewing solution before completing
  if (summary.viewedSolution) {
    score = Math.min(score, SCORE_SOLUTION_VIEW);
  }

  return score;
}

// ---------------------------------------------------------------------------
// Build concept → exercise mapping
// ---------------------------------------------------------------------------

interface ConceptInfo {
  readonly concept: string;
  readonly phase: string;
  readonly exerciseIds: readonly string[];
}

function buildConceptMap(phases: readonly Phase[]): readonly ConceptInfo[] {
  const map = new Map<string, { phase: string; exerciseIds: string[] }>();

  for (const phase of phases) {
    for (const exercise of phase.exercises) {
      const existing = map.get(exercise.concept);
      if (existing) {
        existing.exerciseIds.push(exercise.id);
      } else {
        map.set(exercise.concept, {
          phase: phase.id,
          exerciseIds: [exercise.id],
        });
      }
    }
  }

  return Array.from(map.entries()).map(([concept, info]) => ({
    concept,
    phase: info.phase,
    exerciseIds: info.exerciseIds,
  }));
}

// ---------------------------------------------------------------------------
// Get exit assessment bonus phases
// ---------------------------------------------------------------------------

async function getExitAssessmentBonusPhases(
  userId: number
): Promise<ReadonlySet<string>> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT a.phase_id
     FROM assessment_results ar
     JOIN assessments a ON a.id = ar.assessment_id
     WHERE ar.user_id = $1
       AND a.assessment_type = 'exit'
       AND ar.score_pct >= 70`,
    [userId]
  );
  return new Set(result.rows.map((r: Record<string, unknown>) => r.phase_id as string));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Compute per-concept mastery scores for a user.
 */
export async function computeConceptMastery(
  userId: number,
  themeId: ThemeId
): Promise<readonly ConceptMastery[]> {
  const phases = getThemedPhases(themeId);
  const conceptInfos = buildConceptMap(phases);

  // Fetch attempt summaries and assessment bonuses in parallel
  const [attemptSummaries, bonusPhases] = await Promise.all([
    getAttemptSummaries(userId),
    getExitAssessmentBonusPhases(userId),
  ]);

  // Index summaries by exerciseId for fast lookup
  const summaryByExercise = new Map<string, ExerciseAttemptSummary>();
  for (const s of attemptSummaries) {
    summaryByExercise.set(s.exerciseId, s);
  }

  return conceptInfos.map((info) => {
    const exerciseScores = info.exerciseIds.map((eid) => {
      const summary = summaryByExercise.get(eid);
      return summary ? scoreExercise(summary) : 0;
    });

    // Average across exercises for this concept
    const totalExercises = exerciseScores.length;
    const completedExercises = exerciseScores.filter((s) => s > 0).length;
    const rawAvg =
      totalExercises > 0
        ? exerciseScores.reduce((a, b) => a + b, 0) / totalExercises
        : 0;

    // Add exit assessment bonus if the concept's phase qualifies
    const bonus = bonusPhases.has(info.phase) ? SCORE_EXIT_BONUS : 0;
    const score = Math.min(Math.round(rawAvg + bonus), MASTERY_CAP);

    return {
      concept: info.concept,
      score,
      level: classifyLevel(score),
      exerciseCount: totalExercises,
      completedCount: completedExercises,
    };
  });
}

/**
 * Get the mastery score for a single concept (convenience wrapper).
 */
export async function getConceptScore(
  userId: number,
  themeId: ThemeId,
  concept: string
): Promise<ConceptMastery | undefined> {
  const all = await computeConceptMastery(userId, themeId);
  return all.find((m) => m.concept === concept);
}
