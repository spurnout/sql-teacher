import { getAdminPool } from "@/lib/db/pool";
import { getThemedPhases } from "@/lib/exercises/loader";
import { computeConceptMastery } from "@/lib/adaptive/mastery";
import type { ThemeId } from "@/content/themes/types";
import type { RandomExercisePick } from "./types";

/**
 * Select a random incomplete exercise, weighted toward weak concepts.
 *
 * Algorithm:
 * 1. Get all exercises the user hasn't completed
 * 2. Get concept mastery scores
 * 3. Weight selection toward concepts with mastery < 50 (weak/unknown)
 * 4. Pick one random exercise from the weighted pool
 */
export async function selectRandomExercise(
  userId: number,
  themeId: ThemeId
): Promise<RandomExercisePick | null> {
  const pool = getAdminPool();
  const phases = getThemedPhases(themeId);

  // Get completed exercise IDs
  const completedResult = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [userId]
  );
  const completedIds = new Set(
    completedResult.rows.map((r: Record<string, unknown>) => r.exercise_id as string)
  );

  // Get all incomplete exercises (skip worked-examples and quizzes)
  const candidates: Array<{
    exerciseId: string;
    phaseId: string;
    concept: string;
    title: string;
  }> = [];

  for (const phase of phases) {
    for (const exercise of phase.exercises) {
      if (completedIds.has(exercise.id)) continue;
      if (exercise.mode === "worked-example" || exercise.mode === "quiz") continue;
      candidates.push({
        exerciseId: exercise.id,
        phaseId: phase.id,
        concept: exercise.concept,
        title: exercise.title,
      });
    }
  }

  if (candidates.length === 0) {
    // All exercises completed — pick any non-worked-example exercise
    for (const phase of phases) {
      for (const exercise of phase.exercises) {
        if (exercise.mode === "worked-example" || exercise.mode === "quiz") continue;
        candidates.push({
          exerciseId: exercise.id,
          phaseId: phase.id,
          concept: exercise.concept,
          title: exercise.title,
        });
      }
    }
    if (candidates.length === 0) return null;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }

  // Get concept mastery to weight selection
  const masteryScores = await computeConceptMastery(userId, themeId);
  const masteryByConcept = new Map(
    masteryScores.map((m) => [m.concept, m.score])
  );

  // Weight: weak concepts (score < 50) get weight 3, developing (50-74) get weight 2, strong get weight 1
  const weighted: typeof candidates = [];
  for (const candidate of candidates) {
    const score = masteryByConcept.get(candidate.concept) ?? 0;
    const weight = score < 50 ? 3 : score < 75 ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(candidate);
    }
  }

  const idx = Math.floor(Math.random() * weighted.length);
  return weighted[idx];
}
