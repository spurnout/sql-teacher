/**
 * Types for the adaptive learning engine.
 */

// ---------------------------------------------------------------------------
// Attempt tracking
// ---------------------------------------------------------------------------

export interface ExerciseAttempt {
  readonly id: number;
  readonly userId: number;
  readonly exerciseId: string;
  readonly attemptNumber: number;
  readonly passed: boolean;
  readonly hintsUsed: number;
  readonly timeSpentMs: number | null;
  readonly userSql: string | null;
  readonly createdAt: Date;
}

export interface RecordAttemptInput {
  readonly userId: number;
  readonly exerciseId: string;
  readonly passed: boolean;
  readonly hintsUsed: number;
  readonly timeSpentMs: number | null;
  readonly userSql: string | null;
}

// ---------------------------------------------------------------------------
// Concept mastery
// ---------------------------------------------------------------------------

export type MasteryLevel = "weak" | "developing" | "strong" | "unknown";

export interface ConceptMastery {
  readonly concept: string;
  readonly score: number; // 0–100
  readonly level: MasteryLevel;
  readonly exerciseCount: number;
  readonly completedCount: number;
}

export interface ConceptMasteryResponse {
  readonly concepts: readonly ConceptMastery[];
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export type RecommendationType =
  | "review"
  | "prerequisite-gap"
  | "skip"
  | "next-best";

export interface Recommendation {
  readonly type: RecommendationType;
  readonly concept: string;
  readonly phase: string;
  readonly exerciseId: string;
  readonly title: string;
  readonly reason: string;
  readonly masteryScore: number;
}

export interface RecommendationsResponse {
  readonly recommendations: readonly Recommendation[];
  readonly nextExerciseId: string | null;
}

// ---------------------------------------------------------------------------
// Attempt summary (used internally by mastery engine)
// ---------------------------------------------------------------------------

export interface ExerciseAttemptSummary {
  readonly exerciseId: string;
  readonly totalAttempts: number;
  readonly passed: boolean;
  readonly hintsUsed: number;
  readonly bestTimeMs: number | null;
  readonly viewedSolution: boolean;
}
