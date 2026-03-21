import { getAdminPool } from "@/lib/db/pool";
import type { ScenarioProgress } from "./types";

// ---------------------------------------------------------------------------
// Scenario progress queries
// ---------------------------------------------------------------------------

/**
 * Get progress for a single scenario for a user.
 */
export async function getScenarioProgress(
  userId: number,
  scenarioId: string
): Promise<ScenarioProgress | null> {
  const pool = getAdminPool();

  const progressResult = await pool.query(
    `SELECT current_step, started_at, completed_at
     FROM user_scenario_progress
     WHERE user_id = $1 AND scenario_id = $2`,
    [userId, scenarioId]
  );

  if (!progressResult.rows[0]) return null;

  const stepsResult = await pool.query(
    `SELECT step_index
     FROM user_scenario_step_completions
     WHERE user_id = $1 AND scenario_id = $2
     ORDER BY step_index`,
    [userId, scenarioId]
  );

  const row = progressResult.rows[0];
  return {
    scenarioId,
    currentStep: row.current_step as number,
    startedAt: (row.started_at as Date).toISOString(),
    completedAt: row.completed_at
      ? (row.completed_at as Date).toISOString()
      : null,
    stepsCompleted: stepsResult.rows.map((r) => r.step_index as number),
  };
}

/**
 * Get progress for all scenarios for a user.
 */
export async function getAllScenarioProgress(
  userId: number
): Promise<readonly ScenarioProgress[]> {
  const pool = getAdminPool();

  const progressResult = await pool.query(
    `SELECT scenario_id, current_step, started_at, completed_at
     FROM user_scenario_progress
     WHERE user_id = $1`,
    [userId]
  );

  if (progressResult.rows.length === 0) return [];

  const stepsResult = await pool.query(
    `SELECT scenario_id, step_index
     FROM user_scenario_step_completions
     WHERE user_id = $1
     ORDER BY scenario_id, step_index`,
    [userId]
  );

  // Group step completions by scenario
  const stepsByScenario = new Map<string, number[]>();
  for (const row of stepsResult.rows) {
    const sid = row.scenario_id as string;
    const arr = stepsByScenario.get(sid) ?? [];
    arr.push(row.step_index as number);
    stepsByScenario.set(sid, arr);
  }

  return progressResult.rows.map((row) => ({
    scenarioId: row.scenario_id as string,
    currentStep: row.current_step as number,
    startedAt: (row.started_at as Date).toISOString(),
    completedAt: row.completed_at
      ? (row.completed_at as Date).toISOString()
      : null,
    stepsCompleted: stepsByScenario.get(row.scenario_id as string) ?? [],
  }));
}

/**
 * Start a scenario (no-op if already started).
 */
export async function startScenario(
  userId: number,
  scenarioId: string
): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `INSERT INTO user_scenario_progress (user_id, scenario_id, current_step)
     VALUES ($1, $2, 0)
     ON CONFLICT (user_id, scenario_id) DO NOTHING`,
    [userId, scenarioId]
  );
}

/**
 * Record completion of a scenario step.
 * Returns whether this was a new completion (vs duplicate).
 */
export async function recordStepCompletion(
  userId: number,
  scenarioId: string,
  stepIndex: number,
  userSql: string
): Promise<{ isNew: boolean }> {
  const pool = getAdminPool();

  const result = await pool.query(
    `INSERT INTO user_scenario_step_completions (user_id, scenario_id, step_index, user_sql)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, scenario_id, step_index) DO NOTHING
     RETURNING id`,
    [userId, scenarioId, stepIndex, userSql]
  );

  const isNew = result.rows.length > 0;

  // Advance current_step if this is the furthest step completed
  if (isNew) {
    await pool.query(
      `UPDATE user_scenario_progress
       SET current_step = GREATEST(current_step, $3 + 1)
       WHERE user_id = $1 AND scenario_id = $2`,
      [userId, scenarioId, stepIndex]
    );
  }

  return { isNew };
}

/**
 * Mark a scenario as completed. Returns whether this was a new completion.
 */
export async function completeScenario(
  userId: number,
  scenarioId: string
): Promise<{ isNew: boolean }> {
  const pool = getAdminPool();

  const result = await pool.query(
    `UPDATE user_scenario_progress
     SET completed_at = NOW()
     WHERE user_id = $1 AND scenario_id = $2 AND completed_at IS NULL
     RETURNING id`,
    [userId, scenarioId]
  );

  return { isNew: result.rows.length > 0 };
}
