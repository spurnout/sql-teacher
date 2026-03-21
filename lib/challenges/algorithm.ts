import { ALL_PHASES } from "@/lib/exercises/loader";
import type { Exercise, PhaseId } from "@/lib/exercises/types";

/**
 * Select a daily challenge exercise for a user.
 *
 * Algorithm:
 * 1. Filter to exercises at or below the user's current phase
 * 2. Prefer exercises the user hasn't completed yet
 * 3. If all completed, pick from the harder exercises in their range
 * 4. Use the date as a deterministic seed so the same user gets the same exercise for the day
 */
export function selectDailyChallenge(
  completedExerciseIds: ReadonlySet<string>,
  currentPhaseId: PhaseId,
  dateString: string // YYYY-MM-DD
): Exercise | null {
  // Find the phase index for the current phase
  const currentPhaseIndex = ALL_PHASES.findIndex(
    (p) => p.id === currentPhaseId
  );
  if (currentPhaseIndex === -1) return null;

  // Gather all eligible exercises (current phase and below)
  const eligiblePhases = ALL_PHASES.slice(0, currentPhaseIndex + 1);
  const allEligible = eligiblePhases.flatMap((p) => [...p.exercises]);

  // Filter to open/scaffolded/debug exercises (skip worked-examples and quizzes for challenges)
  const challengeEligible = allEligible.filter(
    (e) => e.mode === "open" || e.mode === "scaffolded" || e.mode === "debug"
  );

  if (challengeEligible.length === 0) return null;

  // Prefer uncompleted exercises
  const uncompleted = challengeEligible.filter(
    (e) => !completedExerciseIds.has(e.id)
  );

  const pool = uncompleted.length > 0 ? uncompleted : challengeEligible;

  // Deterministic selection based on date + pool size
  const seed = hashDate(dateString);
  const index = seed % pool.length;

  return pool[index];
}

/** Simple deterministic hash from a date string */
function hashDate(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash * 31 + char) | 0;
  }
  return Math.abs(hash);
}

/** Determine user's current phase based on completed exercises */
export function getCurrentPhase(
  completedExerciseIds: ReadonlySet<string>
): PhaseId {
  for (const phase of ALL_PHASES) {
    const allDone = phase.exercises.every((e) =>
      completedExerciseIds.has(e.id)
    );
    if (!allDone) return phase.id;
  }
  // All phases complete — return the last one
  return ALL_PHASES[ALL_PHASES.length - 1].id;
}
