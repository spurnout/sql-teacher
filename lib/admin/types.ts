import type { Level } from "@/lib/exercises/types";

export interface AdminUserStat {
  readonly userId: number;
  readonly username: string;
  readonly isAdmin: boolean;
  readonly theme: string;
  readonly createdAt: string;
  readonly exercisesCompleted: number;
  readonly totalXP: number;
  readonly level: Level;
  readonly currentStreak: number;
  readonly lastActive: string | null;
}

export interface AdminTeamSummary {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: number;
  readonly ownerUsername: string;
  readonly createdAt: string;
  readonly memberCount: number;
  readonly customThemeCount: number;
}

export interface AdminCustomThemeSummary {
  readonly id: number;
  readonly orgId: number;
  readonly orgName: string;
  readonly orgSlug: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: "pending" | "provisioned" | "error";
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  readonly id: number;
  readonly adminId: number;
  readonly adminUsername: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  readonly details: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Exercise Analytics
// ---------------------------------------------------------------------------

export interface PhaseAnalytics {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly totalExercises: number;
  readonly completionRate: number;
  readonly avgCompletionRate: number;
}

export interface ExerciseAnalytics {
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly phaseId: string;
  readonly difficulty: string;
  readonly completions: number;
  readonly uniqueAttempts: number;
  readonly avgAttempts: number;
  readonly failRate: number;
  readonly avgHintsUsed: number;
  readonly avgTimeMs: number | null;
}

// ---------------------------------------------------------------------------
// Challenge Analytics
// ---------------------------------------------------------------------------

export interface SpeedRunAnalytics {
  readonly phaseId: string;
  readonly totalSessions: number;
  readonly completedSessions: number;
  readonly completionRate: number;
  readonly avgElapsedMs: number | null;
  readonly bestElapsedMs: number | null;
  readonly avgExercisesCompleted: number;
}

export interface GolfAnalytics {
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly totalRecords: number;
  readonly avgCharCount: number;
  readonly bestCharCount: number;
  readonly uniquePlayers: number;
}

export interface DailyChallengeAnalytics {
  readonly totalChallenges: number;
  readonly completedChallenges: number;
  readonly completionRate: number;
  readonly uniqueParticipants: number;
  readonly streakLeaders: readonly {
    readonly username: string;
    readonly consecutiveDays: number;
  }[];
}

// ---------------------------------------------------------------------------
// System Info
// ---------------------------------------------------------------------------

export interface SystemInfo {
  readonly dbPool: {
    readonly totalConnections: number;
    readonly idleConnections: number;
    readonly waitingClients: number;
  };
  readonly dbStats: {
    readonly totalTables: number;
    readonly totalRows: number;
    readonly dbSizePretty: string;
    readonly cacheHitRatio: number;
  };
  readonly tableStats: readonly {
    readonly tableName: string;
    readonly rowCount: number;
    readonly sizePretty: string;
  }[];
}
