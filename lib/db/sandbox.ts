import { getSandboxPool, getAdminPool } from "./pool";
import { isAllowedSchema } from "@/content/themes";
import type { QueryResult, PoolClient } from "pg";

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

/**
 * Auto-quote PascalCase identifiers (table + column names) in SQL.
 *
 * PostgreSQL lowercases unquoted identifiers, so `SELECT * FROM Invoice_Totals`
 * looks for `invoice_totals` which won't match `Invoice_Totals`. This function
 * finds unquoted identifiers that case-insensitively match names in the schema
 * and wraps them in double quotes with the correct casing.
 *
 * Skips already-quoted identifiers, string literals, and comments.
 */
async function autoQuoteIdentifiers(
  client: PoolClient,
  schemaName: string,
  sql: string
): Promise<string> {
  const { rows } = await client.query(
    `SELECT DISTINCT name FROM (
       SELECT table_name AS name FROM information_schema.tables WHERE table_schema = $1
       UNION ALL
       SELECT column_name AS name FROM information_schema.columns WHERE table_schema = $1
     ) sub
     WHERE name ~ '[A-Z]'`,
    [schemaName]
  );

  if (rows.length === 0) return sql;

  // Build lookup: lowercase → actual casing
  const identMap = new Map<string, string>();
  for (const row of rows) {
    identMap.set((row.name as string).toLowerCase(), row.name as string);
  }

  // Split SQL preserving quoted strings, quoted identifiers, comments
  const parts = sql.split(
    /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|--[^\n]*|\/\*[\s\S]*?\*\/)/
  );

  return parts
    .map((part, i) => {
      // Odd indices are captured delimiters (quoted/comment tokens) — leave as-is
      if (i % 2 === 1) return part;
      // Even indices are bare SQL — replace matching identifiers
      return part.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (word) => {
        const actual = identMap.get(word.toLowerCase());
        return actual ? `"${actual}"` : word;
      });
    })
    .join("");
}

/**
 * Execute an unrestricted admin query (DML/DDL allowed) in a theme's schema.
 * Uses the admin pool with a longer timeout. No statement validation is applied.
 */
export async function executeAdminQuery(
  schemaName: string,
  sql: string,
  options: { timeout?: string } = {}
): Promise<QueryResult> {
  if (!isAllowedSchema(schemaName)) {
    throw new Error(`Invalid schema: ${schemaName}`);
  }

  const pool = getAdminPool();
  const client = await pool.connect();

  try {
    const escapedSchema = `"${schemaName.replace(/"/g, '""')}"`;
    await client.query(`SET search_path = ${escapedSchema}, public`);
    await client.query(
      `SET statement_timeout = '${options.timeout ?? "60s"}'`
    );
    // Auto-quote PascalCase identifiers so users don't need double quotes
    const finalSql = await autoQuoteIdentifiers(client, schemaName, sql);
    const result = await client.query(finalSql);
    return result;
  } finally {
    try {
      await client.query(`SET statement_timeout = DEFAULT`);
      await client.query(`SET search_path = 'public'`);
    } catch {
      // Connection may be broken — pool will discard it
    }
    client.release();
  }
}
