import { getAdminPool } from "@/lib/db/pool";
import { getThemedPhases } from "@/lib/exercises/loader";
import type { ThemeId } from "@/content/themes/types";
import type { Exercise } from "@/lib/exercises/types";
import type { SpeedRunSession, SpeedRunPersonalBest } from "./types";

const DEFAULT_TIME_LIMIT_MS = 600_000; // 10 minutes
const DEFAULT_EXERCISE_COUNT = 5;

// ---------------------------------------------------------------------------
// Exercise selection
// ---------------------------------------------------------------------------

/**
 * Pick random exercises from a phase for a speed run.
 * Only selects open/scaffolded exercises (not worked-examples or quizzes).
 */
export function selectSpeedRunExercises(
  phaseId: string,
  themeId: ThemeId,
  count: number = DEFAULT_EXERCISE_COUNT
): readonly Exercise[] {
  const phases = getThemedPhases(themeId);
  const phase = phases.find((p) => p.id === phaseId);
  if (!phase) return [];

  const eligible = phase.exercises.filter(
    (e) => e.mode === "open" || e.mode === "scaffolded"
  );

  if (eligible.length === 0) return [];

  // Fisher-Yates shuffle on a mutable copy
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

export async function createSpeedRunSession(
  userId: number,
  phaseId: string,
  exerciseIds: readonly string[]
): Promise<SpeedRunSession> {
  const pool = getAdminPool();
  const result = await pool.query(
    `INSERT INTO speed_run_sessions (user_id, phase_id, exercise_ids, time_limit_ms)
     VALUES ($1, $2, $3, $4)
     RETURNING id, phase_id, exercise_ids, time_limit_ms, started_at,
               completed_at, elapsed_ms, exercises_completed`,
    [userId, phaseId, exerciseIds, DEFAULT_TIME_LIMIT_MS]
  );
  return rowToSession(result.rows[0]);
}

export async function getActiveSession(
  userId: number
): Promise<SpeedRunSession | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, phase_id, exercise_ids, time_limit_ms, started_at,
            completed_at, elapsed_ms, exercises_completed
     FROM speed_run_sessions
     WHERE user_id = $1 AND completed_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  return rowToSession(result.rows[0]);
}

export async function completeSpeedRunStep(
  userId: number,
  sessionId: number,
  exerciseId: string
): Promise<SpeedRunSession | null> {
  const pool = getAdminPool();

  // Verify session belongs to user and exercise is in the list
  const sessionResult = await pool.query(
    `SELECT id, exercise_ids, exercises_completed, time_limit_ms, started_at
     FROM speed_run_sessions
     WHERE id = $1 AND user_id = $2 AND completed_at IS NULL`,
    [sessionId, userId]
  );
  if (sessionResult.rows.length === 0) return null;

  const session = sessionResult.rows[0];
  const exerciseIds: string[] = session.exercise_ids;
  if (!exerciseIds.includes(exerciseId)) return null;

  // Deduplication: the exercises are completed in order (index 0, 1, 2...).
  // The current exercise must be the one at position exercises_completed.
  // This prevents counting the same exercise twice via duplicate submissions.
  const expectedIndex = session.exercises_completed as number;
  const actualIndex = exerciseIds.indexOf(exerciseId);
  if (actualIndex !== expectedIndex) {
    // Already completed (index < expectedIndex) or out of order (index > expectedIndex)
    // Return current session state without incrementing
    const currentResult = await pool.query(
      `SELECT id, phase_id, exercise_ids, time_limit_ms, started_at,
              completed_at, elapsed_ms, exercises_completed
       FROM speed_run_sessions WHERE id = $1`,
      [sessionId]
    );
    return rowToSession(currentResult.rows[0]);
  }

  const newCompleted = expectedIndex + 1;
  const allDone = newCompleted >= exerciseIds.length;

  // Calculate elapsed time
  const startedAt = new Date(session.started_at).getTime();
  const elapsed = Date.now() - startedAt;
  const timedOut = elapsed > session.time_limit_ms;

  if (allDone || timedOut) {
    // Complete the session
    const result = await pool.query(
      `UPDATE speed_run_sessions
       SET exercises_completed = $1,
           completed_at = NOW(),
           elapsed_ms = $2
       WHERE id = $3
       RETURNING id, phase_id, exercise_ids, time_limit_ms, started_at,
                 completed_at, elapsed_ms, exercises_completed`,
      [newCompleted, elapsed, sessionId]
    );
    return rowToSession(result.rows[0]);
  }

  // Just increment the counter
  const result = await pool.query(
    `UPDATE speed_run_sessions
     SET exercises_completed = $1
     WHERE id = $2
     RETURNING id, phase_id, exercise_ids, time_limit_ms, started_at,
               completed_at, elapsed_ms, exercises_completed`,
    [newCompleted, sessionId]
  );
  return rowToSession(result.rows[0]);
}

export async function getPersonalBests(
  userId: number
): Promise<readonly SpeedRunPersonalBest[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT DISTINCT ON (phase_id)
            phase_id, elapsed_ms, completed_at
     FROM speed_run_sessions
     WHERE user_id = $1
       AND completed_at IS NOT NULL
       AND exercises_completed = array_length(exercise_ids, 1)
     ORDER BY phase_id, elapsed_ms ASC`,
    [userId]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    phaseId: r.phase_id as string,
    bestElapsedMs: r.elapsed_ms as number,
    completedAt: (r.completed_at as Date).toISOString(),
  }));
}

export async function abandonExpiredSessions(userId: number): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `UPDATE speed_run_sessions
     SET completed_at = NOW(),
         elapsed_ms = time_limit_ms
     WHERE user_id = $1
       AND completed_at IS NULL
       AND started_at + (time_limit_ms || ' milliseconds')::interval < NOW()`,
    [userId]
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToSession(row: Record<string, unknown>): SpeedRunSession {
  return {
    id: row.id as number,
    phaseId: row.phase_id as string,
    exerciseIds: row.exercise_ids as string[],
    timeLimitMs: row.time_limit_ms as number,
    startedAt: (row.started_at as Date).toISOString(),
    completedAt: row.completed_at
      ? (row.completed_at as Date).toISOString()
      : null,
    elapsedMs: (row.elapsed_ms as number) ?? null,
    exercisesCompleted: row.exercises_completed as number,
  };
}
