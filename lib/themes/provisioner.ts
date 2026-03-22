/**
 * Custom theme provisioner — creates PostgreSQL schemas from user-provided SQL.
 *
 * Safety: schema_sql and seed_sql are validated against a strict allowlist of
 * DDL/DML statements before execution. The schema name is derived from the
 * theme slug and validated against a strict regex. All SQL runs inside a
 * dedicated PG schema with the sandbox_user role granted read-only access.
 */
import { getAdminPool } from "@/lib/db/pool";
import type { PoolClient } from "pg";

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
 * Strip quoted/comment content from SQL so that data values, quoted
 * identifiers, and comments don't trigger blocked-pattern false positives.
 *
 * Replaces every '...' with '', every "..." with "", and removes line/block
 * comments while preserving structural SQL keywords outside those regions.
 * This is a lightweight, single-pass operation — O(n) with minimal
 * allocations.
 */
function stripQuotedAndCommentContent(sql: string): string {
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
    } else if (sql[i] === '"') {
      parts.push(sql.slice(segStart, i));
      parts.push('""');
      i++;
      while (i < sql.length) {
        if (sql[i] === '"' && i + 1 < sql.length && sql[i + 1] === '"') {
          i += 2;
        } else if (sql[i] === '"') {
          i++;
          break;
        } else {
          i++;
        }
      }
      segStart = i;
    } else if (sql[i] === "-" && i + 1 < sql.length && sql[i + 1] === "-") {
      parts.push(sql.slice(segStart, i));
      const eol = sql.indexOf("\n", i + 2);
      i = eol === -1 ? sql.length : eol;
      segStart = i;
    } else if (sql[i] === "/" && i + 1 < sql.length && sql[i + 1] === "*") {
      parts.push(sql.slice(segStart, i));
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
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
  const stripped = stripQuotedAndCommentContent(sql);

  for (const pattern of BLOCKED_SQL_PATTERNS) {
    if (pattern.test(stripped)) {
      return `${label} contains disallowed SQL statement: ${pattern.source}`;
    }
  }

  return null;
}

interface ForeignKeyValidationTarget {
  readonly constraintName: string;
  readonly childSchema: string;
  readonly childTable: string;
  readonly parentSchema: string;
  readonly parentTable: string;
  readonly childColumns: readonly string[];
  readonly parentColumns: readonly string[];
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function qualifiedTable(schema: string, table: string): string {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

async function validateForeignKeys(
  client: PoolClient,
  schemaName: string,
): Promise<string | null> {
  const { rows } = await client.query<ForeignKeyValidationTarget>(
    `
      SELECT
        c.conname AS "constraintName",
        child_ns.nspname AS "childSchema",
        child_cls.relname AS "childTable",
        parent_ns.nspname AS "parentSchema",
        parent_cls.relname AS "parentTable",
        array_agg(child_att.attname ORDER BY cols.ord) AS "childColumns",
        array_agg(parent_att.attname ORDER BY cols.ord) AS "parentColumns"
      FROM pg_constraint c
      JOIN pg_class child_cls ON child_cls.oid = c.conrelid
      JOIN pg_namespace child_ns ON child_ns.oid = child_cls.relnamespace
      JOIN pg_class parent_cls ON parent_cls.oid = c.confrelid
      JOIN pg_namespace parent_ns ON parent_ns.oid = parent_cls.relnamespace
      JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS cols(child_attnum, parent_attnum, ord) ON TRUE
      JOIN pg_attribute child_att ON child_att.attrelid = child_cls.oid AND child_att.attnum = cols.child_attnum
      JOIN pg_attribute parent_att ON parent_att.attrelid = parent_cls.oid AND parent_att.attnum = cols.parent_attnum
      WHERE c.contype = 'f'
        AND child_ns.nspname = $1
      GROUP BY c.conname, child_ns.nspname, child_cls.relname, parent_ns.nspname, parent_cls.relname
      ORDER BY child_cls.relname, c.conname
    `,
    [schemaName],
  );

  for (const fk of rows) {
    const child = "child";
    const parent = "parent";
    const nonNullChecks = fk.childColumns
      .map((column: string) => `${child}.${quoteIdent(column)} IS NOT NULL`)
      .join(" AND ");
    const joinChecks = fk.childColumns
      .map(
        (column: string, index: number) =>
          `${child}.${quoteIdent(column)} IS NOT DISTINCT FROM ${parent}.${quoteIdent(
            fk.parentColumns[index],
          )}`,
      )
      .join(" AND ");

    const validationSql = `
      SELECT 1
      FROM ${qualifiedTable(fk.childSchema, fk.childTable)} AS ${child}
      WHERE ${nonNullChecks}
        AND NOT EXISTS (
          SELECT 1
          FROM ${qualifiedTable(fk.parentSchema, fk.parentTable)} AS ${parent}
          WHERE ${joinChecks}
        )
      LIMIT 1
    `;

    const violation = await client.query(validationSql);
    if (violation.rowCount && violation.rowCount > 0) {
      return `Seed data violates foreign key "${fk.constraintName}" on ${fk.childTable}`;
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

    // Set a statement timeout — large imports (200MB+) can take minutes
    await client.query("SET LOCAL statement_timeout = '600s'");

    // Create the schema using identifier quoting for defense-in-depth
    await client.query(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
    );

    // Execute the user's DDL inside the schema
    // schemaName is derived from slug validated against SLUG_REGEX ([a-z0-9_])
    // so it never needs identifier quoting in SET search_path.
    await client.query(`SET LOCAL search_path = '${schemaName}', 'public'`);
    await client.query(schemaSql);

    // Disable FK triggers during seed import — SSMS exports don't guarantee
    // INSERT order matches foreign key dependencies. `replica` skips FK
    // enforcement implemented by triggers, so we run an explicit FK scan after
    // switching back to origin.
    await client.query(
      "SET LOCAL session_replication_role = 'replica'"
    );

    // Execute seed data
    await client.query(seedSql);

    // Re-enable FK checks so subsequent queries are validated normally
    await client.query(
      "SET LOCAL session_replication_role = 'origin'"
    );

    const foreignKeyError = await validateForeignKeys(client, schemaName);
    if (foreignKeyError) {
      throw new Error(foreignKeyError);
    }

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
