import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import {
  getOrgCustomThemes,
  createCustomTheme,
  updateCustomThemeStatus,
  isSlugAvailable,
} from "@/lib/themes/queries";
import {
  provisionCustomTheme,
  deprovisionCustomTheme,
} from "@/lib/themes/provisioner";
import { convertSql, type SqlDialect } from "@/lib/themes/sql-converter";
import type { SchemaReference } from "@/content/schema/reference";

const VALID_SQL_DIALECTS: ReadonlySet<string> = new Set([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
]);

/** All valid source dialects (includes csv for storage/audit) */
const ALL_SOURCE_DIALECTS: ReadonlySet<string> = new Set([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
  "csv",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/;

/** GET /api/custom-themes — list custom themes for user's org */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ themes: [] });
  }

  const themes = await getOrgCustomThemes(org.id);
  return NextResponse.json({ themes });
}

/** POST /api/custom-themes — create and provision a new custom theme */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json(
      { error: "You must be part of an organization" },
      { status: 403 }
    );
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json(
      { error: "Only owners and managers can create custom themes" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    slug,
    name,
    description,
    schemaSql,
    seedSql,
    schemaRef,
    tableMapping,
    sourceDialect,
    rawSql,
  } = body;

  // Validate inputs
  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug. Use lowercase letters, numbers, and hyphens (3-50 chars)." },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return NextResponse.json({ error: "Name is required (max 200 chars)" }, { status: 400 });
  }

  if (typeof schemaSql !== "string" || schemaSql.trim().length === 0 || schemaSql.length > 100_000) {
    return NextResponse.json(
      { error: "Schema SQL is required (max 100KB)" },
      { status: 400 }
    );
  }

  if (typeof seedSql !== "string" || seedSql.length > 100_000) {
    return NextResponse.json(
      { error: "Seed SQL must be a string (max 100KB)" },
      { status: 400 }
    );
  }

  if (
    !schemaRef ||
    typeof schemaRef !== "object" ||
    !("tables" in schemaRef) ||
    !Array.isArray((schemaRef as Record<string, unknown>).tables)
  ) {
    return NextResponse.json(
      { error: "Schema reference with tables array is required" },
      { status: 400 }
    );
  }

  // Validate tableMapping shape if provided
  const validatedTableMapping: Record<string, string> | null =
    tableMapping && typeof tableMapping === "object" && !Array.isArray(tableMapping)
      ? (tableMapping as Record<string, string>)
      : null;

  // Validate source dialect if provided (csv is valid for storage but not for re-conversion)
  const storedDialect: string | null =
    typeof sourceDialect === "string" && ALL_SOURCE_DIALECTS.has(sourceDialect)
      ? sourceDialect
      : null;

  // For SQL dialects, server-side re-conversion: when rawSql + dialect are
  // provided, the server re-converts and uses its own output as the
  // authoritative SQL. CSV-sourced themes skip re-conversion (client already
  // generated PostgreSQL DDL/seed from CSV parsing).
  let finalSchemaSql = schemaSql as string;
  let finalSeedSql = seedSql as string;

  if (
    storedDialect &&
    storedDialect !== "postgresql" &&
    storedDialect !== "csv" &&
    VALID_SQL_DIALECTS.has(storedDialect) &&
    typeof rawSql === "string" &&
    rawSql.trim().length > 0 &&
    rawSql.length <= 200_000
  ) {
    const serverResult = convertSql(rawSql, storedDialect as SqlDialect);
    finalSchemaSql = serverResult.ddl;
    finalSeedSql = serverResult.seed;

    // Reject if server-side conversion produced empty DDL
    if (!finalSchemaSql.trim()) {
      const warningText = serverResult.warnings.length > 0
        ? ` Converter warnings: ${serverResult.warnings.slice(0, 3).join("; ")}`
        : "";
      return NextResponse.json(
        {
          error:
            `Server-side conversion produced no CREATE TABLE statements. ` +
            `The uploaded file may not be a valid ${storedDialect} database dump.${warningText}`,
        },
        { status: 422 }
      );
    }
  }

  // Check slug availability
  const available = await isSlugAvailable(slug);
  if (!available) {
    return NextResponse.json(
      { error: "This slug is already in use" },
      { status: 409 }
    );
  }

  // Create the theme record (using server-authoritative SQL)
  const theme = await createCustomTheme({
    orgId: org.id,
    slug,
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    schemaSql: finalSchemaSql,
    seedSql: finalSeedSql,
    schemaRef: schemaRef as SchemaReference,
    tableMapping: validatedTableMapping,
    sourceDialect: storedDialect,
  });

  // Attempt provisioning (using server-authoritative SQL)
  const result = await provisionCustomTheme(slug, finalSchemaSql, finalSeedSql);

  if (result.success) {
    await updateCustomThemeStatus(theme.id, "provisioned");
    return NextResponse.json({
      theme: { ...theme, status: "provisioned" as const },
    });
  } else {
    await deprovisionCustomTheme(slug);
    const friendlyError = humanizeProvisionError(result.error ?? "Unknown error");
    await updateCustomThemeStatus(theme.id, "error", friendlyError);
    return NextResponse.json(
      {
        error: friendlyError,
        theme: {
          ...theme,
          status: "error" as const,
          error_message: friendlyError,
        },
      },
      { status: 422 }
    );
  }
}

// ---------------------------------------------------------------------------
// Translate PostgreSQL provisioning errors into user-friendly messages
// ---------------------------------------------------------------------------

function humanizeProvisionError(raw: string): string {
  // Syntax errors
  if (/syntax error/i.test(raw)) {
    const near = raw.match(/at or near "([^"]+)"/)?.[1];
    return near
      ? `SQL syntax error near "${near}". Check the generated DDL for incorrect SQL syntax. ` +
          `If you uploaded a non-PostgreSQL dump, make sure the correct dialect is selected.`
      : `SQL syntax error in the generated DDL. Try changing the dialect or editing the preview before submitting.`;
  }

  // Relation already exists
  if (/relation .+ already exists/i.test(raw)) {
    const table = raw.match(/relation "([^"]+)"/)?.[1];
    return `Table "${table ?? "unknown"}" already exists. Try using a different slug or contact support to clean up the previous attempt.`;
  }

  // Type not found
  if (/type .+ does not exist/i.test(raw)) {
    const type = raw.match(/type "([^"]+)"/)?.[1];
    return `Unknown column type "${type ?? "unknown"}". The SQL dialect converter may have missed a type conversion. ` +
      `Edit the DDL preview to replace it with a PostgreSQL-compatible type (TEXT, INTEGER, NUMERIC, etc.).`;
  }

  // Column does not exist (bad INSERT)
  if (/column .+ does not exist/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Column "${col ?? "unknown"}" referenced in an INSERT statement doesn't exist in the table definition. ` +
      `This usually means the DDL and seed data are out of sync. Check the preview and ensure column names match.`;
  }

  // Duplicate column
  if (/column .+ specified more than once/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Duplicate column "${col ?? "unknown"}" in a CREATE TABLE statement. Check the DDL for repeated column definitions.`;
  }

  // Foreign key violation
  if (/violates foreign key constraint/i.test(raw)) {
    return `Seed data references a record that doesn't exist yet (foreign key violation). ` +
      `Make sure INSERT statements are ordered so that parent tables are populated before child tables.`;
  }

  // Not-null violation
  if (/violates not-null constraint/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `A required column "${col ?? "unknown"}" received a NULL value. ` +
      `Check the seed data to ensure all NOT NULL columns have values.`;
  }

  // Unique constraint / duplicate key violation
  if (/duplicate key value violates unique constraint/i.test(raw)) {
    const constraint = raw.match(/constraint "([^"]+)"/)?.[1];
    return `Duplicate key value violates unique constraint "${constraint ?? "unknown"}". ` +
      `The seed data contains duplicate values for a column that requires unique entries. ` +
      `Check the INSERT statements for repeated primary key or unique column values.`;
  }

  // Disallowed SQL (from provisioner blocked patterns)
  if (/disallowed SQL statement/i.test(raw)) {
    return `The SQL contains a statement that is not allowed for security reasons. ` +
      `Only CREATE TABLE, CREATE INDEX, ALTER TABLE, and INSERT statements are permitted.`;
  }

  // Statement timeout
  if (/statement timeout/i.test(raw)) {
    return `The SQL took too long to execute (>30s). Try reducing the amount of seed data or simplifying the schema.`;
  }

  // Exceeded max length
  if (/exceeds maximum length/i.test(raw)) {
    return raw; // Already user-friendly
  }

  // Fallback: include the raw error with a prefix
  return `Database provisioning failed: ${raw}. ` +
    `If this error persists, try simplifying the schema or editing the DDL preview.`;
}
