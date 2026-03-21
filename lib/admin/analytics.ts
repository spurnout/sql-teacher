import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES } from "@/lib/exercises/loader";
import type {
  PhaseAnalytics,
  ExerciseAnalytics,
  SpeedRunAnalytics,
  GolfAnalytics,
  DailyChallengeAnalytics,
} from "./types";

// ---------------------------------------------------------------------------
// Exercise Analytics
// ---------------------------------------------------------------------------

export async function getExerciseAnalytics(): Promise<{
  readonly phases: readonly PhaseAnalytics[];
  readonly hardestExercises: readonly ExerciseAnalytics[];
  readonly totalUniqueUsersWithAttempts: number;
}> {
  const pool = getAdminPool();

  // Build exercise metadata map from content layer
  const exerciseMap = new Map<
    string,
    { title: string; phaseId: string; difficulty: string }
  >();
  for (const phase of ALL_PHASES) {
    for (const ex of phase.exercises) {
      exerciseMap.set(ex.id, {
        title: ex.title,
        phaseId: phase.id,
        difficulty: ex.difficulty,
      });
    }
  }

  // Get total unique users who have attempted any exercise
  const totalUsersResult = await pool.query(
    `SELECT COUNT(DISTINCT user_id)::int AS total FROM user_progress`
  );
  const totalUniqueUsers: number = totalUsersResult.rows[0]?.total ?? 0;

  // Get completion counts per exercise
  const completionResult = await pool.query(
    `SELECT exercise_id, COUNT(DISTINCT user_id)::int AS completions
     FROM user_progress
     GROUP BY exercise_id`
  );

  const completionsByExercise = new Map<string, number>();
  for (const row of completionResult.rows) {
    completionsByExercise.set(row.exercise_id as string, row.completions as number);
  }

  // Compute per-phase analytics
  const phases: PhaseAnalytics[] = ALL_PHASES.map((phase) => {
    const exerciseCount = phase.exercises.length;
    if (exerciseCount === 0 || totalUniqueUsers === 0) {
      return {
        phaseId: phase.id,
        phaseTitle: phase.title,
        totalExercises: exerciseCount,
        completionRate: 0,
        avgCompletionRate: 0,
      };
    }

    // Per-exercise completion rates, then average
    const perExerciseRates = phase.exercises.map((ex) => {
      const completions = completionsByExercise.get(ex.id) ?? 0;
      return (completions / totalUniqueUsers) * 100;
    });
    const avgCompletionRate =
      perExerciseRates.reduce((a, b) => a + b, 0) / perExerciseRates.length;

    // "Completion rate" = % of users who completed ALL exercises in this phase
    const minCompletions = Math.min(
      ...phase.exercises.map((ex) => completionsByExercise.get(ex.id) ?? 0)
    );
    const completionRate = (minCompletions / totalUniqueUsers) * 100;

    return {
      phaseId: phase.id,
      phaseTitle: phase.title,
      totalExercises: exerciseCount,
      completionRate: Math.round(completionRate * 10) / 10,
      avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
    };
  });

  // Get hardest exercises (top 10 by fail rate)
  const attemptStats = await pool.query(
    `SELECT
       a.exercise_id,
       COUNT(DISTINCT a.user_id)::int AS unique_attempts,
       ROUND(AVG(a.attempt_number), 1)::float AS avg_attempts,
       ROUND(AVG(a.hints_used), 1)::float AS avg_hints,
       ROUND(AVG(a.time_spent_ms))::int AS avg_time_ms
     FROM user_exercise_attempts a
     WHERE a.passed = TRUE
     GROUP BY a.exercise_id
     ORDER BY avg_attempts DESC`
  );

  // Get users who attempted but never completed
  const neverCompletedResult = await pool.query(
    `SELECT a.exercise_id, COUNT(DISTINCT a.user_id)::int AS attempted
     FROM user_exercise_attempts a
     LEFT JOIN user_progress p
       ON p.user_id = a.user_id AND p.exercise_id = a.exercise_id
     WHERE p.id IS NULL
     GROUP BY a.exercise_id`
  );

  const neverCompletedMap = new Map<string, number>();
  for (const row of neverCompletedResult.rows) {
    neverCompletedMap.set(row.exercise_id as string, row.attempted as number);
  }

  const hardestExercises: ExerciseAnalytics[] = [];
  for (const row of attemptStats.rows) {
    const exerciseId = row.exercise_id as string;
    const meta = exerciseMap.get(exerciseId);
    if (!meta) continue;

    const uniqueAttempts = row.unique_attempts as number;
    const neverCompleted = neverCompletedMap.get(exerciseId) ?? 0;
    const totalAttempters = uniqueAttempts + neverCompleted;
    const failRate =
      totalAttempters > 0
        ? Math.round((neverCompleted / totalAttempters) * 1000) / 10
        : 0;

    hardestExercises.push({
      exerciseId,
      exerciseTitle: meta.title,
      phaseId: meta.phaseId,
      difficulty: meta.difficulty,
      completions: completionsByExercise.get(exerciseId) ?? 0,
      uniqueAttempts: totalAttempters,
      avgAttempts: row.avg_attempts as number,
      failRate,
      avgHintsUsed: row.avg_hints as number,
      avgTimeMs: (row.avg_time_ms as number) ?? null,
    });
  }

  // Sort by fail rate descending, take top 10
  hardestExercises.sort((a, b) => b.failRate - a.failRate);
  const topHardest = hardestExercises.slice(0, 10);

  return {
    phases,
    hardestExercises: topHardest,
    totalUniqueUsersWithAttempts: totalUniqueUsers,
  };
}

// ---------------------------------------------------------------------------
// Challenge Analytics
// ---------------------------------------------------------------------------

export async function getChallengeAnalytics(): Promise<{
  readonly speedRuns: readonly SpeedRunAnalytics[];
  readonly golfRecords: readonly GolfAnalytics[];
  readonly dailyChallenges: DailyChallengeAnalytics;
}> {
  const pool = getAdminPool();

  // Build exercise metadata map for golf titles
  const exerciseMap = new Map<string, string>();
  for (const phase of ALL_PHASES) {
    for (const ex of phase.exercises) {
      exerciseMap.set(ex.id, ex.title);
    }
  }

  // Speed run analytics per phase
  const speedRunResult = await pool.query(
    `SELECT
       phase_id,
       COUNT(*)::int AS total_sessions,
       COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed_sessions,
       ROUND(AVG(elapsed_ms) FILTER (WHERE completed_at IS NOT NULL))::int AS avg_elapsed_ms,
       MIN(elapsed_ms) FILTER (WHERE completed_at IS NOT NULL) AS best_elapsed_ms,
       ROUND(AVG(exercises_completed), 1)::float AS avg_exercises_completed
     FROM speed_run_sessions
     GROUP BY phase_id
     ORDER BY phase_id`
  );

  const speedRuns: SpeedRunAnalytics[] = speedRunResult.rows.map(
    (r: Record<string, unknown>) => {
      const total = r.total_sessions as number;
      const completed = r.completed_sessions as number;
      return {
        phaseId: r.phase_id as string,
        totalSessions: total,
        completedSessions: completed,
        completionRate:
          total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
        avgElapsedMs: (r.avg_elapsed_ms as number) ?? null,
        bestElapsedMs: (r.best_elapsed_ms as number) ?? null,
        avgExercisesCompleted: r.avg_exercises_completed as number,
      };
    }
  );

  // Golf analytics per exercise (top 15 by player count)
  const golfResult = await pool.query(
    `SELECT
       exercise_id,
       COUNT(*)::int AS total_records,
       ROUND(AVG(char_count))::int AS avg_char_count,
       MIN(char_count)::int AS best_char_count,
       COUNT(DISTINCT user_id)::int AS unique_players
     FROM sql_golf_records
     GROUP BY exercise_id
     ORDER BY unique_players DESC
     LIMIT 15`
  );

  const golfRecords: GolfAnalytics[] = golfResult.rows.map(
    (r: Record<string, unknown>) => ({
      exerciseId: r.exercise_id as string,
      exerciseTitle: exerciseMap.get(r.exercise_id as string) ?? r.exercise_id as string,
      totalRecords: r.total_records as number,
      avgCharCount: r.avg_char_count as number,
      bestCharCount: r.best_char_count as number,
      uniquePlayers: r.unique_players as number,
    })
  );

  // Daily challenge analytics
  const dailyResult = await pool.query(
    `SELECT
       COUNT(*)::int AS total_challenges,
       COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed_challenges,
       COUNT(DISTINCT user_id)::int AS unique_participants
     FROM daily_challenges`
  );

  const dailyRow = dailyResult.rows[0] ?? {
    total_challenges: 0,
    completed_challenges: 0,
    unique_participants: 0,
  };
  const totalChallenges = dailyRow.total_challenges as number;
  const completedChallenges = dailyRow.completed_challenges as number;

  // Streak leaders — count consecutive completed daily challenge dates per user
  const streakResult = await pool.query(
    `WITH completed_dates AS (
       SELECT user_id, challenge_date
       FROM daily_challenges
       WHERE completed_at IS NOT NULL
     ),
     date_groups AS (
       SELECT
         user_id,
         challenge_date,
         challenge_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY challenge_date))::int AS grp
       FROM completed_dates
     ),
     streaks AS (
       SELECT user_id, COUNT(*)::int AS streak_len
       FROM date_groups
       GROUP BY user_id, grp
     ),
     best_streaks AS (
       SELECT user_id, MAX(streak_len) AS consecutive_days
       FROM streaks
       GROUP BY user_id
       ORDER BY consecutive_days DESC
       LIMIT 5
     )
     SELECT u.username, bs.consecutive_days
     FROM best_streaks bs
     JOIN app_users u ON u.id = bs.user_id
     ORDER BY bs.consecutive_days DESC`
  );

  const streakLeaders = streakResult.rows.map(
    (r: Record<string, unknown>) => ({
      username: r.username as string,
      consecutiveDays: r.consecutive_days as number,
    })
  );

  return {
    speedRuns,
    golfRecords,
    dailyChallenges: {
      totalChallenges,
      completedChallenges,
      completionRate:
        totalChallenges > 0
          ? Math.round((completedChallenges / totalChallenges) * 1000) / 10
          : 0,
      uniqueParticipants: dailyRow.unique_participants as number,
      streakLeaders,
    },
  };
}
