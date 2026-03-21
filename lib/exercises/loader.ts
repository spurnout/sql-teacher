import type { Exercise, Phase, PhaseId, CapstoneProject } from "./types";
import type { ThemeId } from "@/content/themes/types";
import { getTheme } from "@/content/themes";

// Re-export for backward compat — serious theme phases
import { seriousTheme } from "@/content/themes/serious";

export const ALL_PHASES: readonly Phase[] = seriousTheme.phases;

// ---------------------------------------------------------------------------
// Theme-aware loaders
// ---------------------------------------------------------------------------

/** Get all phases for a given theme */
export function getThemedPhases(themeId: ThemeId): readonly Phase[] {
  const theme = getTheme(themeId);
  if (!theme) return ALL_PHASES; // fallback to serious
  return theme.phases;
}

/** Get a single phase for a given theme */
export function getThemedPhase(
  themeId: ThemeId,
  phaseId: string
): Phase | undefined {
  return getThemedPhases(themeId).find((p) => p.id === phaseId);
}

/** Get a single exercise for a given theme */
export function getThemedExercise(
  themeId: ThemeId,
  phaseId: string,
  exerciseId: string
): Exercise | undefined {
  if (phaseId === "capstone") {
    const theme = getTheme(themeId);
    const capstones = theme?.capstones ?? seriousTheme.capstones;
    for (const capstone of capstones) {
      const ex = capstone.exercises.find((e) => e.id === exerciseId);
      if (ex) return ex;
    }
    return undefined;
  }
  const phase = getThemedPhase(themeId, phaseId);
  if (!phase) return undefined;
  return phase.exercises.find((e) => e.id === exerciseId);
}

/** Get capstone projects for a given theme */
export function getThemedCapstones(themeId: ThemeId): readonly CapstoneProject[] {
  const theme = getTheme(themeId);
  return theme?.capstones ?? seriousTheme.capstones;
}

/** Find any exercise by ID within a theme */
export function findThemedExerciseById(
  themeId: ThemeId,
  exerciseId: string
): Exercise | undefined {
  const phases = getThemedPhases(themeId);
  for (const phase of phases) {
    const ex = phase.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  const capstones = getThemedCapstones(themeId);
  for (const capstone of capstones) {
    const ex = capstone.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}

/** Get adjacent exercises within a theme */
export function getThemedAdjacentExercises(
  themeId: ThemeId,
  exerciseId: string
): { prev: Exercise | null; next: Exercise | null; phaseId: PhaseId | null } {
  const phases = getThemedPhases(themeId);
  const allExercises = phases.flatMap((p) =>
    p.exercises.map((e) => ({ exercise: e, phaseId: p.id }))
  );
  const currentIndex = allExercises.findIndex(
    (e) => e.exercise.id === exerciseId
  );

  if (currentIndex === -1) {
    return { prev: null, next: null, phaseId: null };
  }

  return {
    prev: currentIndex > 0 ? allExercises[currentIndex - 1].exercise : null,
    next:
      currentIndex < allExercises.length - 1
        ? allExercises[currentIndex + 1].exercise
        : null,
    phaseId: allExercises[currentIndex].phaseId,
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible functions (default to serious theme)
// ---------------------------------------------------------------------------

export function getPhase(phaseId: string): Phase | undefined {
  return ALL_PHASES.find((p) => p.id === phaseId);
}

export function getExercise(
  phaseId: string,
  exerciseId: string
): Exercise | undefined {
  return getThemedExercise("serious", phaseId, exerciseId);
}

export function findExerciseById(exerciseId: string): Exercise | undefined {
  return findThemedExerciseById("serious", exerciseId);
}

export function getPhaseExercises(phaseId: string): readonly Exercise[] {
  return getPhase(phaseId)?.exercises ?? [];
}

export function getAdjacentExercises(
  exerciseId: string
): { prev: Exercise | null; next: Exercise | null; phaseId: PhaseId | null } {
  return getThemedAdjacentExercises("serious", exerciseId);
}
