import { getAdminPool } from "@/lib/db/pool";
import type { AuditLogEntry } from "./types";

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface AuditEventParams {
  readonly adminId: number;
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string;
  readonly details?: Record<string, unknown>;
  readonly ipAddress?: string;
}

/**
 * Record an admin action in the audit log.
 * Callers should fire-and-forget: `logAuditEvent({...}).catch(() => {})`.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `INSERT INTO audit_log (admin_id, action, target_type, target_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.adminId,
      params.action,
      params.targetType,
      params.targetId ?? null,
      params.details ? JSON.stringify(params.details) : null,
      params.ipAddress ?? null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export interface AuditLogQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly action?: string;
}

export async function getAuditLog(
  options: AuditLogQueryOptions = {}
): Promise<{ readonly entries: readonly AuditLogEntry[]; readonly total: number }> {
  const pool = getAdminPool();
  const limit = Math.min(options.limit ?? 50, 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (options.action) {
    conditions.push(`a.action = $${paramIndex}`);
    params.push(options.action);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Total count
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM audit_log a ${whereClause}`,
    params
  );
  const total: number = countResult.rows[0]?.total ?? 0;

  // Paginated results
  const dataParams = [...params, limit, offset];
  const result = await pool.query(
    `SELECT
       a.id,
       a.admin_id,
       COALESCE(u.username, '[deleted]') AS admin_username,
       a.action,
       a.target_type,
       a.target_id,
       a.details,
       a.ip_address,
       a.created_at
     FROM audit_log a
     LEFT JOIN app_users u ON u.id = a.admin_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  );

  const entries: readonly AuditLogEntry[] = result.rows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as number,
      adminId: r.admin_id as number,
      adminUsername: r.admin_username as string,
      action: r.action as string,
      targetType: r.target_type as string,
      targetId: (r.target_id as string) ?? null,
      details: (r.details as Record<string, unknown>) ?? null,
      ipAddress: (r.ip_address as string) ?? null,
      createdAt: (r.created_at as Date).toISOString(),
    })
  );

  return { entries, total };
}
