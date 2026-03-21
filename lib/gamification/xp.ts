import type { Difficulty, ExerciseMode, Level } from "@/lib/exercises/types";

// ---------------------------------------------------------------------------
// XP calculation
// ---------------------------------------------------------------------------

const BASE_XP: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 25,
  advanced: 50,
} as const;

const MODE_MULTIPLIER: Record<ExerciseMode, number> = {
  "worked-example": 0.5,
  quiz: 0.8,
  scaffolded: 1.0,
  open: 1.2,
  debug: 1.1,
} as const;

/** First-attempt bonus: +50% if user never viewed the solution */
const FIRST_ATTEMPT_MULTIPLIER = 1.5;

/** Streak bonus: +10% per day, capped at 7 days (max +70%) */
const STREAK_BONUS_PER_DAY = 0.1;
const MAX_STREAK_BONUS_DAYS = 7;

export function calculateXP(
  difficulty: Difficulty,
  mode: ExerciseMode,
  firstAttempt: boolean,
  streakDays: number
): number {
  const base = BASE_XP[difficulty] * MODE_MULTIPLIER[mode];
  const withFirstAttempt = firstAttempt ? base * FIRST_ATTEMPT_MULTIPLIER : base;
  const clampedStreak = Math.min(streakDays, MAX_STREAK_BONUS_DAYS);
  const streakMultiplier = 1 + clampedStreak * STREAK_BONUS_PER_DAY;
  return Math.round(withFirstAttempt * streakMultiplier);
}

// ---------------------------------------------------------------------------
// Level thresholds
// ---------------------------------------------------------------------------

const LEVEL_THRESHOLDS: readonly { readonly minXP: number; readonly level: Level }[] = [
  { minXP: 1500, level: "Master" },
  { minXP: 1000, level: "Expert" },
  { minXP: 600, level: "Advanced" },
  { minXP: 300, level: "Intermediate" },
  { minXP: 100, level: "Apprentice" },
  { minXP: 0, level: "Novice" },
] as const;

export function getLevel(totalXP: number): Level {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.minXP) return threshold.level;
  }
  return "Novice";
}

export function getNextLevelThreshold(totalXP: number): {
  readonly currentLevel: Level;
  readonly nextLevel: Level | null;
  readonly currentThreshold: number;
  readonly nextThreshold: number | null;
  readonly progress: number; // 0-1
} {
  const currentLevel = getLevel(totalXP);
  const currentIdx = LEVEL_THRESHOLDS.findIndex((t) => t.level === currentLevel);

  if (currentIdx === 0) {
    // Already at max level
    return {
      currentLevel,
      nextLevel: null,
      currentThreshold: LEVEL_THRESHOLDS[0].minXP,
      nextThreshold: null,
      progress: 1,
    };
  }

  const currentThreshold = LEVEL_THRESHOLDS[currentIdx].minXP;
  const nextThreshold = LEVEL_THRESHOLDS[currentIdx - 1].minXP;
  const nextLevel = LEVEL_THRESHOLDS[currentIdx - 1].level;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? (totalXP - currentThreshold) / range : 0;

  return {
    currentLevel,
    nextLevel,
    currentThreshold,
    nextThreshold,
    progress: Math.min(Math.max(progress, 0), 1),
  };
}
