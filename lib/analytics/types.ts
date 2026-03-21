/**
 * Shared TypeScript types for analytics API responses.
 */

// ---------------------------------------------------------------------------
// Learner Analytics
// ---------------------------------------------------------------------------

export interface XPDataPoint {
  readonly date: string;
  readonly dailyXP: number;
  readonly cumulativeXP: number;
}

export interface XPOverTimeResponse {
  readonly points: readonly XPDataPoint[];
}

export interface ActivityDay {
  readonly date: string;
  readonly count: number;
}

export interface ActivityHeatmapResponse {
  readonly days: readonly ActivityDay[];
}

export interface PhaseMastery {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly completionPct: number;
  readonly completed: number;
  readonly total: number;
}

export interface ConceptMasteryResponse {
  readonly phases: readonly PhaseMastery[];
}

export interface PhaseAssessment {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly entryScore: number | null;
  readonly exitScore: number | null;
}

export interface AssessmentScoresResponse {
  readonly phases: readonly PhaseAssessment[];
}

// ---------------------------------------------------------------------------
// Team Analytics
// ---------------------------------------------------------------------------

export interface FunnelPhase {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly membersReached: number;
  readonly membersCurrently: number;
}

export interface CompletionFunnelResponse {
  readonly phases: readonly FunnelPhase[];
  readonly totalMembers: number;
}

export interface TeamActivityWeek {
  readonly weekStart: string;
  readonly exercisesCompleted: number;
  readonly activeMembers: number;
}

export interface TeamActivityResponse {
  readonly weeks: readonly TeamActivityWeek[];
}

export interface MemberStat {
  readonly username: string;
  readonly totalXP: number;
  readonly exercisesCompleted: number;
  readonly completionPct: number;
}

export interface MemberComparisonResponse {
  readonly members: readonly MemberStat[];
}

export interface BottleneckPhase {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly stuckCount: number;
  readonly avgDaysStuck: number;
}

export interface BottleneckResponse {
  readonly phases: readonly BottleneckPhase[];
}
