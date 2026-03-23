/**
 * Database queries for custom theme exercises.
 *
 * Exercises for custom themes are stored as JSONB in custom_theme_exercises,
 * unlike builtin themes which are defined as TypeScript constants.
 */
import { getAdminPool } from "@/lib/db/pool";
import type { Exercise } from "@/lib/exercises/types";

/** Fetch all exercises for a custom theme, ordered by phase then order. */
export async function getCustomThemeExercises(
  customThemeId: number
): Promise<readonly Exercise[]> {
  const pool = getAdminPool();
  const result = await pool.query<{ exercise_json: Exercise }>(
    `SELECT exercise_json
     FROM custom_theme_exercises
     WHERE custom_theme_id = $1
     ORDER BY exercise_json->>'phase',
              (exercise_json->>'order')::int`,
    [customThemeId]
  );
  return result.rows.map((r) => r.exercise_json);
}

/** Get the count of exercises for a custom theme. */
export async function getCustomThemeExerciseCount(
  customThemeId: number
): Promise<number> {
  const pool = getAdminPool();
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM custom_theme_exercises
     WHERE custom_theme_id = $1`,
    [customThemeId]
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * Upsert a single exercise for a custom theme.
 * Uses ON CONFLICT to update if exercise_id already exists.
 */
export async function upsertCustomThemeExercise(
  customThemeId: number,
  exercise: Exercise
): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `INSERT INTO custom_theme_exercises (custom_theme_id, exercise_id, exercise_json, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (custom_theme_id, exercise_id)
     DO UPDATE SET exercise_json = EXCLUDED.exercise_json`,
    [customThemeId, exercise.id, JSON.stringify(exercise)]
  );
}

/**
 * Bulk upsert exercises for a custom theme.
 * Returns the number of exercises upserted.
 */
export async function bulkUpsertExercises(
  customThemeId: number,
  exercises: readonly Exercise[]
): Promise<number> {
  if (exercises.length === 0) return 0;

  const pool = getAdminPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const exercise of exercises) {
      await client.query(
        `INSERT INTO custom_theme_exercises (custom_theme_id, exercise_id, exercise_json, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (custom_theme_id, exercise_id)
         DO UPDATE SET exercise_json = EXCLUDED.exercise_json`,
        [customThemeId, exercise.id, JSON.stringify(exercise)]
      );
    }

    await client.query("COMMIT");
    return exercises.length;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Delete a single exercise from a custom theme. */
export async function deleteCustomThemeExercise(
  customThemeId: number,
  exerciseId: string
): Promise<boolean> {
  const pool = getAdminPool();
  const result = await pool.query(
    `DELETE FROM custom_theme_exercises
     WHERE custom_theme_id = $1 AND exercise_id = $2`,
    [customThemeId, exerciseId]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Delete all exercises for a custom theme. */
export async function deleteAllCustomThemeExercises(
  customThemeId: number
): Promise<number> {
  const pool = getAdminPool();
  const result = await pool.query(
    `DELETE FROM custom_theme_exercises WHERE custom_theme_id = $1`,
    [customThemeId]
  );
  return result.rowCount ?? 0;
}
