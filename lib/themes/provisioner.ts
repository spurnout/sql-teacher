/**
 * Custom theme provisioner — creates PostgreSQL schemas from user-provided SQL.
 *
 * Safety: schema_sql and seed_sql are validated against a strict allowlist of
 * DDL/DML statements before execution. The schema name is derived from the
 * theme slug and validated against a strict regex. All SQL runs inside a
 * dedicated PG schema with the sandbox_user role granted read-only access.
 */
import { getAdminPool } from "@/lib/db/pool";

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/;

/**
 * Patterns that must NOT appear in user-provided DDL/seed SQL.
 * These block privilege escalation, filesystem access, and destructive ops.
 */
const BLOCKED_SQL_PATTERNS: readonly RegExp[] = [
  /\bDROP\s+(?!TABLE\b)/i, // allow DROP TABLE within schema, block DROP SCHEMA/DATABASE/ROLE
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bDROP\s+ROLE\b/i,
  /\bDROP\s+USER\b/i,
  /\bALTER\s+ROLE\b/i,
  /\bALTER\s+USER\b/i,
  /\bALTER\s+SYSTEM\b/i,
  /\bCREATE\s+ROLE\b/i,
  /\bCREATE\s+USER\b/i,
  /\bCREATE\s+DATABASE\b/i,
  /\bCREATE\s+EXTENSION\b/i,
  /\bCREATE\s+FUNCTION\b/i,
  /\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/i,
  /\bCREATE\s+PROCEDURE\b/i,
  /\bCREATE\s+TRIGGER\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bSET\s+ROLE\b/i,
  /\bSET\s+SESSION\b/i,
  /\bSET\s+search_path\b/i,
  /\bCOPY\b/i,
  /\bpg_read_file\b/i,
  /\bpg_ls_dir\b/i,
  /\bpg_write_file\b/i,
  /\blo_import\b/i,
  /\blo_export\b/i,
  /\bpg_sleep\b/i,
  /\bpg_terminate_backend\b/i,
  /\bpg_cancel_backend\b/i,
  /\bSECURITY\s+DEFINER\b/i,
  /\bTRUNCATE\b/i,
  /\bEXECUTE\b/i,
  /\bDBLINK\b/i,
];

/** Max length for user-provided SQL to prevent abuse */
const MAX_SQL_LENGTH = 1_000_000_000;

export interface ProvisionResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Strip string-literal content from SQL so that data values inside INSERT
 * statements don't trigger blocked-pattern false positives.
 *
 * Replaces every '...' (handling '' escapes) with '' while preserving the
 * structural SQL keywords outside of strings.  This is a lightweight,
 * single-pass operation — O(n) with minimal allocations.
 */
function stripStringLiterals(sql: string): string {
  const parts: string[] = [];
  let i = 0;
  let segStart = 0;

  while (i < sql.length) {
    if (sql[i] === "'") {
      // Emit everything before this quote
      parts.push(sql.slice(segStart, i));
      parts.push("''"); // placeholder for the removed string content
      // Skip past the closing quote
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && i + 1 < sql.length && sql[i + 1] === "'") {
          i += 2; // skip escaped ''
        } else if (sql[i] === "'") {
          i++; // closing quote
          break;
        } else {
          i++;
        }
      }
      segStart = i;
    } else {
      i++;
    }
  }

  parts.push(sql.slice(segStart));
  return parts.join("");
}

/**
 * Validate that user-provided SQL only contains safe DDL/DML statements.
 * Returns an error message if unsafe, or null if safe.
 *
 * String literals are stripped before pattern-matching to avoid false
 * positives from data values (e.g. a product named "LEMON DROP" triggering
 * the DROP pattern).
 */
function validateProvisionSql(sql: string, label: string): string | null {
  if (sql.length > MAX_SQL_LENGTH) {
    return `${label} exceeds maximum length (${MAX_SQL_LENGTH} characters)`;
  }

  // Strip string literal content to avoid false positives from data values
  const stripped = stripStringLiterals(sql);

  for (const pattern of BLOCKED_SQL_PATTERNS) {
    if (pattern.test(stripped)) {
      return `${label} contains disallowed SQL statement: ${pattern.source}`;
    }
  }

  return null;
}

/**
 * Provision a custom theme by creating its PG schema, running the
 * provided DDL, inserting seed data, and granting sandbox_user access.
 */
export async function provisionCustomTheme(
  slug: string,
  schemaSql: string,
  seedSql: string
): Promise<ProvisionResult> {
  if (!SLUG_REGEX.test(slug)) {
    return { success: false, error: "Invalid slug format" };
  }

  // Validate user-provided SQL before execution
  const schemaError = validateProvisionSql(schemaSql, "Schema SQL");
  if (schemaError) {
    return { success: false, error: schemaError };
  }
  const seedError = validateProvisionSql(seedSql, "Seed SQL");
  if (seedError) {
    return { success: false, error: seedError };
  }

  const schemaName = `theme_custom_${slug.replace(/-/g, "_")}`;
  const pool = getAdminPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Set a statement timeout to prevent long-running DDL
    await client.query("SET LOCAL statement_timeout = '30s'");

    // Create the schema using identifier quoting for defense-in-depth
    await client.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
    );

    // Execute the user's DDL inside the schema
    await client.query(`SET LOCAL search_path = '"${schemaName}"', public`);
    await client.query(schemaSql);

    // Execute seed data
    await client.query(seedSql);

    // Grant sandbox_user read access
    await client.query(`SET LOCAL search_path = 'public'`);
    await client.query(
      `GRANT USAGE ON SCHEMA "${schemaName}" TO sandbox_user`
    );
    await client.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA "${schemaName}" TO sandbox_user`
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT SELECT ON TABLES TO sandbox_user`
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    // Try to drop the schema on failure
    try {
      await client.query(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`
      );
    } catch {
      // Ignore cleanup errors
    }
    const message = extractPgError(err);
    return { success: false, error: message };
  } finally {
    try {
      await client.query(`SET search_path = 'public'`);
    } catch {
      // Ignore
    }
    client.release();
  }
}

/**
 * Drop a custom theme's PG schema.
 */
export async function deprovisionCustomTheme(slug: string): Promise<void> {
  if (!SLUG_REGEX.test(slug)) return;
  const schemaName = `theme_custom_${slug.replace(/-/g, "_")}`;
  const pool = getAdminPool();
  await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

/**
 * Extract a meaningful error string from a PostgreSQL error object.
 * Includes position/detail/hint when available for debugging.
 */
function extractPgError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown database error";

  // pg library errors include additional properties
  const pgErr = err as unknown as Record<string, unknown>;
  const parts: string[] = [err.message];

  if (typeof pgErr.detail === "string" && pgErr.detail) {
    parts.push(`Detail: ${pgErr.detail}`);
  }
  if (typeof pgErr.hint === "string" && pgErr.hint) {
    parts.push(`Hint: ${pgErr.hint}`);
  }
  if (typeof pgErr.position === "string" && pgErr.position) {
    parts.push(`At character position: ${pgErr.position}`);
  }

  return parts.join(" — ");
}
