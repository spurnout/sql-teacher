import { getAdminPool } from "@/lib/db/pool";

/**
 * Delete expired sessions from the database.
 *
 * Called opportunistically on login (fire-and-forget) and can also
 * be invoked from a cron job or scheduled task.
 *
 * Uses a throttle to avoid running more than once per 10 minutes
 * even under high login traffic.
 */

const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
let lastCleanup = 0;

export async function cleanupExpiredSessions(): Promise<number> {
  const now = Date.now();
  if (now - lastCleanup < THROTTLE_MS) {
    return 0;
  }
  lastCleanup = now;

  const pool = getAdminPool();
  const result = await pool.query(
    `DELETE FROM app_sessions WHERE expires_at < NOW()`
  );
  return result.rowCount ?? 0;
}
