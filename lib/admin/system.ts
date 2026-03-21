import { getAdminPool } from "@/lib/db/pool";
import type { SystemInfo } from "./types";

/**
 * Gather system information: connection pool stats, database stats, table sizes.
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  const pool = getAdminPool();

  // Pool stats come from the pg Pool object itself (runtime properties)
  const dbPool = {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
  };

  // Database-level stats
  const [tablesResult, sizeResult, cacheResult, totalRowsResult] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      ),
      pool.query(
        `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
      ),
      pool.query(
        `SELECT ROUND(
           100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0), 2
         )::float AS hit_ratio
         FROM pg_stat_database
         WHERE datname = current_database()`
      ),
      pool.query(
        `SELECT COALESCE(SUM(n_live_tup), 0)::int AS total_rows
         FROM pg_stat_user_tables
         WHERE schemaname = 'public'`
      ),
    ]);

  const dbStats = {
    totalTables: (tablesResult.rows[0]?.total as number) ?? 0,
    totalRows: (totalRowsResult.rows[0]?.total_rows as number) ?? 0,
    dbSizePretty: (sizeResult.rows[0]?.db_size as string) ?? "unknown",
    cacheHitRatio: (cacheResult.rows[0]?.hit_ratio as number) ?? 0,
  };

  // Per-table stats (top 20 by size)
  const tableResult = await pool.query(
    `SELECT
       s.relname AS table_name,
       s.n_live_tup::int AS row_count,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS size_pretty
     FROM pg_stat_user_tables s
     JOIN pg_class c ON c.relname = s.relname AND c.relnamespace = (
       SELECT oid FROM pg_namespace WHERE nspname = 'public'
     )
     WHERE s.schemaname = 'public'
     ORDER BY pg_total_relation_size(c.oid) DESC
     LIMIT 20`
  );

  const tableStats = tableResult.rows.map((r: Record<string, unknown>) => ({
    tableName: r.table_name as string,
    rowCount: r.row_count as number,
    sizePretty: r.size_pretty as string,
  }));

  return { dbPool, dbStats, tableStats };
}
