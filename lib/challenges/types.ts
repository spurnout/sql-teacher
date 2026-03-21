// ---------------------------------------------------------------------------
// Speed Run types
// ---------------------------------------------------------------------------

export interface SpeedRunSession {
  readonly id: number;
  readonly phaseId: string;
  readonly exerciseIds: readonly string[];
  readonly timeLimitMs: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly elapsedMs: number | null;
  readonly exercisesCompleted: number;
}

export interface SpeedRunPersonalBest {
  readonly phaseId: string;
  readonly bestElapsedMs: number;
  readonly completedAt: string;
}

// ---------------------------------------------------------------------------
// SQL Golf types
// ---------------------------------------------------------------------------

export interface GolfRecord {
  readonly exerciseId: string;
  readonly charCount: number;
  readonly userSql: string;
  readonly achievedAt: string;
}

// ---------------------------------------------------------------------------
// Random Practice types
// ---------------------------------------------------------------------------

export interface RandomExercisePick {
  readonly exerciseId: string;
  readonly phaseId: string;
  readonly concept: string;
  readonly title: string;
}
