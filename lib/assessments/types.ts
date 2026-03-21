export type AssessmentType = "entry" | "exit";

export interface Assessment {
  readonly id: number;
  readonly phaseId: string;
  readonly assessmentType: AssessmentType;
  readonly title: string;
  readonly timeLimitMinutes: number;
  readonly exerciseCount: number;
}

export interface AssessmentResult {
  readonly id: number;
  readonly assessmentId: number;
  readonly scorePct: number;
  readonly exercisesPassed: number;
  readonly exercisesTotal: number;
  readonly startedAt: string;
  readonly completedAt: string;
}

/** Assessment with exercises selected for this attempt */
export interface AssessmentAttempt {
  readonly attemptId: number;
  readonly assessment: Assessment;
  readonly exerciseIds: readonly string[];
  readonly startedAt: string;
  readonly expiresAt: string;
}
