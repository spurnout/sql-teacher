/**
 * Database queries for adaptive learning — attempt tracking and retrieval.
 */
import { getAdminPool } from "@/lib/db/pool";
import type { ExerciseAttemptSummary, RecordAttemptInput } from "./types";

// ---------------------------------------------------------------------------
// Record a new attempt
// ---------------------------------------------------------------------------

/**
 * Record a single exercise attempt. The attempt_number is computed
 * server-side as MAX(existing) + 1 for the given user + exercise.
 *
 * A UNIQUE index on (user_id, exercise_id, attempt_number) prevents
 * duplicates from concurrent requests. If a conflict occurs, we retry
 * up to 3 times — each retry recomputes the MAX.
 */
export async function recordAttempt(input: RecordAttemptInput): Promise<void> {
  const pool = getAdminPool();
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await pool.query(
        `INSERT INTO user_exercise_attempts
           (user_id, exercise_id, attempt_number, passed, hints_used, time_spent_ms, user_sql)
         VALUES (
           $1, $2,
           COALESCE(
             (SELECT MAX(attempt_number) FROM user_exercise_attempts
              WHERE user_id = $1 AND exercise_id = $2), 0
           ) + 1,
           $3, $4, $5, $6
         )`,
        [
          input.userId,
          input.exerciseId,
          input.passed,
          input.hintsUsed,
          input.timeSpentMs,
          input.userSql,
        ]
      );
      return; // Success
    } catch (err: unknown) {
      // Retry on unique constraint violation (concurrent attempt_number collision)
      const isUniqueViolation =
        err instanceof Error &&
        "code" in err &&
        (err as Record<string, unknown>).code === "23505";
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      // Fall through to retry
    }
  }
}

// ---------------------------------------------------------------------------
// Retrieve attempt summaries for mastery scoring
// ---------------------------------------------------------------------------

/**
 * For each exercise the user has attempted, return a summary of their
 * best performance (used by the mastery engine to score concepts).
 */
export async function getAttemptSummaries(
  userId: number
): Promise<readonly ExerciseAttemptSummary[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       a.exercise_id,
       COUNT(*)::int                         AS total_attempts,
       BOOL_OR(a.passed)                     AS passed,
       MAX(a.hints_used)::int                AS hints_used,
       MIN(CASE WHEN a.passed THEN a.time_spent_ms END)::int AS best_time_ms,
       EXISTS(
         SELECT 1 FROM user_solution_views sv
         WHERE sv.user_id = $1 AND sv.exercise_id = a.exercise_id
       )                                     AS viewed_solution
     FROM user_exercise_attempts a
     WHERE a.user_id = $1
     GROUP BY a.exercise_id`,
    [userId]
  );

  return result.rows.map((r: Record<string, unknown>) => ({
    exerciseId: r.exercise_id as string,
    totalAttempts: r.total_attempts as number,
    passed: r.passed as boolean,
    hintsUsed: r.hints_used as number,
    bestTimeMs: (r.best_time_ms as number) ?? null,
    viewedSolution: r.viewed_solution as boolean,
  }));
}

// ---------------------------------------------------------------------------
// Get attempt count for a specific exercise (used to check attempt_number)
// ---------------------------------------------------------------------------

export async function getAttemptCount(
  userId: number,
  exerciseId: string
): Promise<number> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM user_exercise_attempts
     WHERE user_id = $1 AND exercise_id = $2`,
    [userId, exerciseId]
  );
  return (result.rows[0]?.count as number) ?? 0;
}
