import type { Badge, BadgeId, PhaseId } from "@/lib/exercises/types";

// ---------------------------------------------------------------------------
// Badge catalog
// ---------------------------------------------------------------------------

export const ALL_BADGES: readonly Badge[] = [
  {
    id: "first-query",
    name: "First Query",
    description: "Complete your very first SQL exercise",
    icon: "🚀",
  },
  {
    id: "phase-0-complete",
    name: "SQL Fundamentals",
    description: "Complete all exercises in Phase 0",
    icon: "📘",
  },
  {
    id: "phase-1-complete",
    name: "JOIN Master",
    description: "Complete all exercises in Phase 1",
    icon: "🔗",
  },
  {
    id: "phase-2-complete",
    name: "Subquery Sage",
    description: "Complete all exercises in Phase 2",
    icon: "🔍",
  },
  {
    id: "phase-3-complete",
    name: "CTE Architect",
    description: "Complete all exercises in Phase 3",
    icon: "🏗️",
  },
  {
    id: "phase-4-complete",
    name: "Window Wizard",
    description: "Complete all exercises in Phase 4",
    icon: "🪟",
  },
  {
    id: "phase-5-complete",
    name: "Performance Pro",
    description: "Complete all exercises in Phase 5",
    icon: "⚡",
  },
  {
    id: "phase-6-complete",
    name: "Pattern Expert",
    description: "Complete all exercises in Phase 6",
    icon: "🧩",
  },
  {
    id: "phase-7-complete",
    name: "DDL Scholar",
    description: "Complete all exercises in Phase 7",
    icon: "📐",
  },
  {
    id: "phase-8-complete",
    name: "DBA Ready",
    description: "Complete all exercises in Phase 8",
    icon: "🛡️",
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Pass all quizzes without viewing any solutions",
    icon: "🎯",
  },
  {
    id: "independence",
    name: "Independence",
    description: "Complete any phase without viewing a single solution",
    icon: "💪",
  },
  {
    id: "streak-7",
    name: "Streak Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "🔥",
  },
  {
    id: "full-curriculum",
    name: "Full Curriculum",
    description: "Complete all 9 phases of the SQL curriculum",
    icon: "🎓",
  },
  {
    id: "certified",
    name: "Certified",
    description: "Earn your SQL Proficiency Certificate",
    icon: "🏆",
  },
  {
    id: "scenario-master",
    name: "Scenario Master",
    description: "Complete all multi-step scenarios",
    icon: "📊",
  },
] as const;

export function getBadge(id: BadgeId): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

// ---------------------------------------------------------------------------
// Phase → badge mapping
// ---------------------------------------------------------------------------

const PHASE_BADGE_MAP: Record<string, BadgeId> = {
  "phase-0": "phase-0-complete",
  "phase-1": "phase-1-complete",
  "phase-2": "phase-2-complete",
  "phase-3": "phase-3-complete",
  "phase-4": "phase-4-complete",
  "phase-5": "phase-5-complete",
  "phase-6": "phase-6-complete",
  "phase-7": "phase-7-complete",
  "phase-8": "phase-8-complete",
};

const ALL_CURRICULUM_PHASES: readonly PhaseId[] = [
  "phase-0",
  "phase-1",
  "phase-2",
  "phase-3",
  "phase-4",
  "phase-5",
  "phase-6",
  "phase-7",
  "phase-8",
];

// ---------------------------------------------------------------------------
// Badge eligibility check
// ---------------------------------------------------------------------------

export interface BadgeContext {
  /** All exercise IDs the user has completed (after this completion) */
  readonly completedExerciseIds: ReadonlySet<string>;
  /** All exercise IDs where the user viewed the solution */
  readonly solutionViewedIds: ReadonlySet<string>;
  /** All badges the user already has */
  readonly existingBadgeIds: ReadonlySet<string>;
  /** Current streak (after update) */
  readonly currentStreak: number;
  /** All phases with their exercise IDs */
  readonly phaseExercises: ReadonlyMap<string, readonly string[]>;
  /** All quiz exercise IDs */
  readonly quizExerciseIds: ReadonlySet<string>;
  /** Whether all capstones are complete */
  readonly allCapstonesComplete: boolean;
  /** Whether all scenarios are complete */
  readonly allScenariosComplete: boolean;
  /** Total number of completions (used for first-query check) */
  readonly totalCompletions: number;
}

/**
 * Returns list of badge IDs the user has newly earned (not already in existingBadgeIds).
 */
export function checkBadgeEligibility(ctx: BadgeContext): readonly BadgeId[] {
  const newBadges: BadgeId[] = [];

  const maybeAward = (id: BadgeId) => {
    if (!ctx.existingBadgeIds.has(id)) {
      newBadges.push(id);
    }
  };

  // First query
  if (ctx.totalCompletions >= 1) {
    maybeAward("first-query");
  }

  // Phase completion badges
  for (const phaseId of ALL_CURRICULUM_PHASES) {
    const exerciseIds = ctx.phaseExercises.get(phaseId);
    if (!exerciseIds || exerciseIds.length === 0) continue;
    const allComplete = exerciseIds.every((id) => ctx.completedExerciseIds.has(id));
    if (allComplete) {
      const badgeId = PHASE_BADGE_MAP[phaseId];
      if (badgeId) maybeAward(badgeId);
    }
  }

  // Quiz master: all quizzes passed without solution views
  if (ctx.quizExerciseIds.size > 0) {
    const allQuizzesDone = [...ctx.quizExerciseIds].every((id) =>
      ctx.completedExerciseIds.has(id)
    );
    const noQuizSolutions = [...ctx.quizExerciseIds].every(
      (id) => !ctx.solutionViewedIds.has(id)
    );
    if (allQuizzesDone && noQuizSolutions) {
      maybeAward("quiz-master");
    }
  }

  // Independence: any phase completed with zero solution views on its exercises
  for (const phaseId of ALL_CURRICULUM_PHASES) {
    const exerciseIds = ctx.phaseExercises.get(phaseId);
    if (!exerciseIds || exerciseIds.length === 0) continue;
    const allComplete = exerciseIds.every((id) => ctx.completedExerciseIds.has(id));
    const noSolutions = exerciseIds.every((id) => !ctx.solutionViewedIds.has(id));
    if (allComplete && noSolutions) {
      maybeAward("independence");
      break; // only need one phase
    }
  }

  // Streak warrior: 7-day streak
  if (ctx.currentStreak >= 7) {
    maybeAward("streak-7");
  }

  // Full curriculum: all 9 phases complete
  const allPhasesComplete = ALL_CURRICULUM_PHASES.every((phaseId) => {
    const exerciseIds = ctx.phaseExercises.get(phaseId);
    if (!exerciseIds || exerciseIds.length === 0) return false;
    return exerciseIds.every((id) => ctx.completedExerciseIds.has(id));
  });
  if (allPhasesComplete) {
    maybeAward("full-curriculum");
  }

  // Certified: all capstones complete
  if (ctx.allCapstonesComplete) {
    maybeAward("certified");
  }

  // Scenario master: all scenarios complete
  if (ctx.allScenariosComplete) {
    maybeAward("scenario-master");
  }

  return newBadges;
}
