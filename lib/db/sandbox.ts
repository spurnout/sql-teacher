import { getSandboxPool, getAdminPool } from "./pool";
import { isAllowedSchema } from "@/content/themes";
import type { QueryResult } from "pg";

/**
 * Execute a query in a specific theme's schema.
 * Uses a dedicated client from the pool with SET search_path,
 * then resets before releasing.
 */
export async function executeWithThemeSchema(
  schemaName: string,
  sql: string,
  options: { useAdmin?: boolean } = {}
): Promise<QueryResult> {
  if (!isAllowedSchema(schemaName)) {
    throw new Error(`Invalid schema: ${schemaName}`);
  }

  const pool = options.useAdmin ? getAdminPool() : getSandboxPool();
  const client = await pool.connect();

  try {
    // Set search_path to the theme schema (+ public for system catalogs)
    // Use double-quoted identifier to prevent SQL injection (schemaName is
    // already validated by isAllowedSchema, but defense-in-depth matters)
    const escapedSchema = `"${schemaName.replace(/"/g, '""')}"`;
    await client.query(`SET search_path = ${escapedSchema}, public`);
    // Prevent runaway queries from holding pool connections (session-scoped — SET LOCAL requires a transaction)
    await client.query(`SET statement_timeout = '5s'`);
    const result = await client.query(sql);
    return result;
  } finally {
    // Reset session settings before returning client to pool
    try {
      await client.query(`SET statement_timeout = DEFAULT`);
      await client.query(`SET search_path = 'public'`);
    } catch {
      // If reset fails, the connection may be broken — it will be discarded by the pool
    }
    client.release();
  }
}

/**
 * Execute a validation query (comparing student SQL to expected SQL)
 * within a specific theme's schema.
 */
export async function validateWithThemeSchema(
  schemaName: string,
  equivalenceQuery: string
): Promise<QueryResult> {
  return executeWithThemeSchema(schemaName, equivalenceQuery, { useAdmin: true });
}
