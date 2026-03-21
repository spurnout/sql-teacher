import { getAdminPool } from "@/lib/db/pool";
import { hashPassword } from "@/lib/auth/password";
import { getLevel } from "@/lib/gamification/xp";
import { deprovisionCustomTheme } from "@/lib/themes/provisioner";
import type { AdminUserStat, AdminTeamSummary, AdminCustomThemeSummary } from "./types";

export interface UserQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly search?: string;
}

export interface PaginatedUsersResult {
  readonly users: readonly AdminUserStat[];
  readonly total: number;
}

/**
 * Get users with their progress stats for admin dashboard.
 * Supports pagination and search to avoid loading all users at once.
 */
export async function getAllUsersWithStats(
  options: UserQueryOptions = {}
): Promise<PaginatedUsersResult> {
  const pool = getAdminPool();
  const limit = Math.min(options.limit ?? 50, 200);
  const offset = Math.max(options.offset ?? 0, 0);
  const search = options.search?.trim() ?? null;

  // Build WHERE clause for search
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`u.username ILIKE $${paramIndex}`);
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    params.push(`%${escaped}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Get total count for pagination
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM app_users u ${whereClause}`,
    params
  );
  const total: number = countResult.rows[0]?.total ?? 0;

  // Get paginated results
  const dataParams = [...params, limit, offset];
  const result = await pool.query(
    `SELECT
      u.id,
      u.username,
      u.is_admin,
      u.theme,
      u.created_at,
      COALESCE(p.completed_count, 0) AS exercises_completed,
      COALESCE(x.total_xp, 0) AS total_xp,
      COALESCE(s.current_streak, 0) AS current_streak,
      p.last_active
    FROM app_users u
    LEFT JOIN (
      SELECT user_id, COUNT(*)::int AS completed_count, MAX(completed_at) AS last_active
      FROM user_progress GROUP BY user_id
    ) p ON p.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COALESCE(SUM(xp_amount), 0)::int AS total_xp
      FROM user_xp_events GROUP BY user_id
    ) x ON x.user_id = u.id
    LEFT JOIN user_streaks s ON s.user_id = u.id
    ${whereClause}
    ORDER BY u.created_at ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  );

  const users = result.rows.map((r) => ({
    userId: r.id as number,
    username: r.username as string,
    isAdmin: r.is_admin as boolean,
    theme: r.theme as string,
    createdAt: r.created_at as string,
    exercisesCompleted: r.exercises_completed as number,
    totalXP: r.total_xp as number,
    level: getLevel(r.total_xp as number),
    currentStreak: r.current_streak as number,
    lastActive: (r.last_active as string) ?? null,
  }));

  return { users, total };
}

/**
 * Compute summary stats across ALL users (not just the current page).
 */
export async function getGlobalSummaryStats(): Promise<{
  totalUsers: number;
  activeThisWeek: number;
  totalExercisesCompleted: number;
  avgXP: number;
  totalTeams: number;
  totalCustomThemes: number;
  customThemesErrors: number;
}> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       COUNT(u.id)::int AS total_users,
       COUNT(DISTINCT CASE WHEN p.last_active >= NOW() - INTERVAL '7 days' THEN u.id END)::int AS active_this_week,
       COALESCE(SUM(p.completed_count), 0)::int AS total_exercises_completed,
       CASE WHEN COUNT(u.id) > 0
         THEN ROUND(COALESCE(SUM(x.total_xp), 0)::numeric / COUNT(u.id))::int
         ELSE 0
       END AS avg_xp,
       (SELECT COUNT(*)::int FROM organizations) AS total_teams,
       (SELECT COUNT(*)::int FROM custom_themes) AS total_custom_themes,
       (SELECT COUNT(*)::int FROM custom_themes WHERE status = 'error') AS custom_themes_errors
     FROM app_users u
     LEFT JOIN (
       SELECT user_id, COUNT(*)::int AS completed_count, MAX(completed_at) AS last_active
       FROM user_progress GROUP BY user_id
     ) p ON p.user_id = u.id
     LEFT JOIN (
       SELECT user_id, COALESCE(SUM(xp_amount), 0)::int AS total_xp
       FROM user_xp_events GROUP BY user_id
     ) x ON x.user_id = u.id`
  );
  const row = result.rows[0];
  return {
    totalUsers: Number(row.total_users),
    activeThisWeek: Number(row.active_this_week),
    totalExercisesCompleted: Number(row.total_exercises_completed),
    avgXP: Number(row.avg_xp),
    totalTeams: Number(row.total_teams),
    totalCustomThemes: Number(row.total_custom_themes),
    customThemesErrors: Number(row.custom_themes_errors),
  };
}

/**
 * Create a new user account (admin-initiated).
 */
export async function createUser(
  username: string,
  password: string
): Promise<{ id: number; username: string }> {
  const pool = getAdminPool();
  const passwordHash = await hashPassword(password);

  const result = await pool.query(
    `INSERT INTO app_users (username, password_hash) VALUES ($1, $2) RETURNING id`,
    [username.toLowerCase(), passwordHash]
  );

  return {
    id: result.rows[0].id as number,
    username: username.toLowerCase(),
  };
}

/**
 * Reset a user's password (admin-initiated).
 */
export async function resetUserPassword(
  userId: number,
  newPassword: string
): Promise<void> {
  const pool = getAdminPool();
  const passwordHash = await hashPassword(newPassword);

  await pool.query(
    `UPDATE app_users SET password_hash = $1 WHERE id = $2`,
    [passwordHash, userId]
  );

  // Invalidate all sessions for this user so compromised tokens can't be reused
  await pool.query(
    `DELETE FROM app_sessions WHERE user_id = $1`,
    [userId]
  );
}

/**
 * Delete a user and all their data.
 * CASCADE on foreign keys handles related tables (sessions, progress, xp, etc).
 */
export async function deleteUser(userId: number): Promise<boolean> {
  const pool = getAdminPool();
  const result = await pool.query(
    `DELETE FROM app_users WHERE id = $1 AND is_admin = FALSE RETURNING id`,
    [userId]
  );
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------------
// Bulk user import
// ---------------------------------------------------------------------------

export interface BulkCreateResult {
  readonly created: number;
  readonly errors: readonly { readonly username: string; readonly error: string }[];
}

/**
 * Create multiple user accounts in a single transaction.
 * Collects per-row errors for partial success reporting.
 */
export async function bulkCreateUsers(
  users: readonly { readonly username: string; readonly password: string }[]
): Promise<BulkCreateResult> {
  const pool = getAdminPool();
  const client = await pool.connect();
  const errors: { username: string; error: string }[] = [];
  let created = 0;

  try {
    await client.query("BEGIN");

    for (const user of users) {
      const name = user.username.trim().toLowerCase();
      const pw = user.password;

      if (name.length < 3 || name.length > 32) {
        errors.push({ username: name, error: "Username must be 3–32 characters." });
        continue;
      }
      if (pw.length < 6 || pw.length > 128) {
        errors.push({ username: name, error: "Password must be 6–128 characters." });
        continue;
      }

      try {
        const hash = await hashPassword(pw);
        await client.query(
          `INSERT INTO app_users (username, password_hash) VALUES ($1, $2)`,
          [name, hash]
        );
        created++;
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          "code" in err &&
          (err as Record<string, unknown>).code === "23505"
        ) {
          errors.push({ username: name, error: "Username already taken." });
        } else {
          errors.push({ username: name, error: "Failed to create user." });
        }
      }
    }

    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Bulk import transaction failed.");
  } finally {
    client.release();
  }

  return { created, errors };
}

// ---------------------------------------------------------------------------
// Team admin queries
// ---------------------------------------------------------------------------

/**
 * Get all organizations with owner info and member/theme counts.
 */
export async function getAllOrganizations(): Promise<readonly AdminTeamSummary[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       o.id, o.name, o.slug, o.owner_id, o.created_at,
       u.username AS owner_username,
       (SELECT COUNT(*)::int FROM org_members WHERE org_id = o.id) AS member_count,
       (SELECT COUNT(*)::int FROM custom_themes WHERE org_id = o.id) AS custom_theme_count
     FROM organizations o
     JOIN app_users u ON u.id = o.owner_id
     ORDER BY o.created_at DESC`
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    ownerId: r.owner_id as number,
    ownerUsername: r.owner_username as string,
    createdAt: (r.created_at as Date).toISOString(),
    memberCount: r.member_count as number,
    customThemeCount: r.custom_theme_count as number,
  }));
}

/**
 * Delete an organization and clean up its provisioned custom themes.
 * Deletes the DB record first (CASCADE removes members/invites/themes rows),
 * then cleans up the PG schemas. This ordering ensures that if schema cleanup
 * fails, the DB state is consistent (record gone) and orphaned schemas can
 * be reconciled later.
 */
export async function deleteOrganization(orgId: number): Promise<boolean> {
  const pool = getAdminPool();

  // Collect provisioned theme slugs before deleting (CASCADE will remove rows)
  const themes = await pool.query(
    `SELECT slug, status FROM custom_themes WHERE org_id = $1`,
    [orgId]
  );
  const provisionedSlugs = themes.rows
    .filter((t) => (t.status as string) === "provisioned")
    .map((t) => t.slug as string);

  // Delete org record (CASCADE removes members, invites, custom_themes rows)
  const result = await pool.query(
    `DELETE FROM organizations WHERE id = $1 RETURNING id`,
    [orgId]
  );
  if (result.rows.length === 0) return false;

  // Clean up PG schemas after successful record deletion
  for (const slug of provisionedSlugs) {
    try {
      await deprovisionCustomTheme(slug);
    } catch {
      // Schema cleanup failure is non-fatal — can be reconciled later
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Custom theme admin queries
// ---------------------------------------------------------------------------

/**
 * Get all custom themes across all orgs with org info.
 */
export async function getAllCustomThemes(): Promise<readonly AdminCustomThemeSummary[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       ct.id, ct.org_id, ct.slug, ct.name, ct.description,
       ct.status, ct.error_message, ct.created_at,
       o.name AS org_name, o.slug AS org_slug
     FROM custom_themes ct
     JOIN organizations o ON o.id = ct.org_id
     ORDER BY ct.created_at DESC`
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    id: r.id as number,
    orgId: r.org_id as number,
    orgName: r.org_name as string,
    orgSlug: r.org_slug as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    status: r.status as "pending" | "provisioned" | "error",
    errorMessage: (r.error_message as string) ?? null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

/**
 * Get a custom theme with its SQL content (for retry provisioning).
 */
export async function getCustomThemeWithSql(
  id: number
): Promise<{
  readonly slug: string;
  readonly schemaSql: string;
  readonly seedSql: string;
  readonly status: "pending" | "provisioned" | "error";
} | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT slug, schema_sql, seed_sql, status FROM custom_themes WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    slug: row.slug as string,
    schemaSql: row.schema_sql as string,
    seedSql: row.seed_sql as string,
    status: row.status as "pending" | "provisioned" | "error",
  };
}
