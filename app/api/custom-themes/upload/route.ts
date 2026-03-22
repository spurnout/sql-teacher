export const runtime = "nodejs";

/** Allow up to 10 minutes for large file processing */
export const maxDuration = 600;

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import {
  createCustomTheme,
  updateCustomThemeStatus,
  isSlugAvailable,
} from "@/lib/themes/queries";
import {
  provisionCustomTheme,
  deprovisionCustomTheme,
} from "@/lib/themes/provisioner";
import { convertSql, type SqlDialect } from "@/lib/themes/sql-converter";
import { generateSchemaRef } from "@/lib/themes/schema-parser";
import type { SchemaReference } from "@/content/schema/reference";

const VALID_SQL_DIALECTS: ReadonlySet<string> = new Set([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/;

const MAX_UPLOAD_SIZE = 1_000_000_000; // 1GB

/**
 * POST /api/custom-themes/upload
 *
 * Accepts a FormData upload with a raw SQL file. Performs server-side
 * conversion, schema reference generation, and provisioning in one step.
 * Designed for large files that cannot be processed client-side.
 */
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

  // Parse FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data. Please try uploading again." },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const slug = formData.get("slug") as string | null;
  const name = formData.get("name") as string | null;
  const description = (formData.get("description") as string) ?? "";
  const dialect = formData.get("dialect") as string | null;

  // Validate required fields
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "A non-empty SQL file is required." },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      {
        error:
          `File too large (${(file.size / 1_000_000).toFixed(1)}MB). ` +
          `Maximum upload size is ${MAX_UPLOAD_SIZE / 1_000_000_000}GB.`,
      },
      { status: 400 }
    );
  }

  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        error:
          "Invalid slug. Use lowercase letters, numbers, and hyphens (3-50 chars).",
      },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return NextResponse.json(
      { error: "Name is required (max 200 chars)" },
      { status: 400 }
    );
  }

  if (typeof dialect !== "string" || !VALID_SQL_DIALECTS.has(dialect)) {
    return NextResponse.json(
      {
        error: `Invalid dialect "${dialect ?? ""}". Supported: ${[...VALID_SQL_DIALECTS].join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Check slug availability
  const available = await isSlugAvailable(slug);
  if (!available) {
    return NextResponse.json(
      { error: "This slug is already in use" },
      { status: 409 }
    );
  }

  // Read file content
  const fileSizeMB = (file.size / 1_000_000).toFixed(1);
  console.log(`[upload] Reading file: ${file.name} (${fileSizeMB}MB), dialect: ${dialect}`);
  const readStart = Date.now();

  let rawSql: string;
  try {
    rawSql = await file.text();
  } catch {
    console.error(`[upload] Failed to read file after ${Date.now() - readStart}ms`);
    return NextResponse.json(
      {
        error:
          "Could not read the uploaded file. Make sure it is a valid text-based SQL file.",
      },
      { status: 400 }
    );
  }

  console.log(`[upload] File read complete (${Date.now() - readStart}ms, ${rawSql.length} chars)`);

  if (!rawSql.trim()) {
    return NextResponse.json(
      { error: "The uploaded file is empty." },
      { status: 400 }
    );
  }

  // Convert SQL to PostgreSQL
  console.log(`[upload] Starting SQL conversion (${dialect} → postgresql)...`);
  const convertStart = Date.now();

  let schemaSql: string;
  let seedSql: string;
  let warnings: readonly string[];

  if (dialect === "postgresql") {
    const result = convertSql(rawSql, "postgresql");
    schemaSql = result.ddl;
    seedSql = result.seed;
    warnings = result.warnings;
  } else {
    const result = convertSql(rawSql, dialect as SqlDialect);
    schemaSql = result.ddl;
    seedSql = result.seed;
    warnings = result.warnings;
  }

  console.log(
    `[upload] Conversion complete (${Date.now() - convertStart}ms): ` +
      `DDL ${(schemaSql.length / 1000).toFixed(0)}KB, ` +
      `seed ${(seedSql.length / 1000).toFixed(0)}KB, ` +
      `${warnings.length} warnings`
  );

  if (!schemaSql.trim()) {
    const warningText =
      warnings.length > 0
        ? ` Converter notes: ${warnings.slice(0, 3).join("; ")}`
        : "";
    return NextResponse.json(
      {
        error:
          `No CREATE TABLE statements found after converting from ${dialect}. ` +
          `The file may not contain database schema definitions (table structures). ` +
          `Make sure you export both schema and data from your database tool.${warningText}`,
      },
      { status: 422 }
    );
  }

  // Generate schema reference from the converted DDL
  console.log("[upload] Generating schema reference...");
  const schemaRef: SchemaReference = generateSchemaRef(schemaSql);

  if (schemaRef.tables.length === 0) {
    return NextResponse.json(
      {
        error:
          "Could not parse any table definitions from the converted SQL. " +
          "The file format may not be supported. Try exporting as a plain-text SQL dump.",
      },
      { status: 422 }
    );
  }

  console.log(`[upload] Schema ref: ${schemaRef.tables.length} tables detected`);

  // Create theme record
  console.log("[upload] Creating theme record...");
  const theme = await createCustomTheme({
    orgId: org.id,
    slug,
    name: name.trim(),
    description: description.trim(),
    schemaSql,
    seedSql,
    schemaRef,
    tableMapping: null,
    sourceDialect: dialect,
  });

  // Provision the database
  console.log(`[upload] Provisioning database schema "${slug}"...`);
  const provisionStart = Date.now();
  const result = await provisionCustomTheme(slug, schemaSql, seedSql);
  console.log(
    `[upload] Provisioning ${result.success ? "succeeded" : "failed"} (${Date.now() - provisionStart}ms)`
  );

  if (result.success) {
    await updateCustomThemeStatus(theme.id, "provisioned");
    const totalMs = Date.now() - readStart;
    console.log(`[upload] Done! Total time: ${(totalMs / 1000).toFixed(1)}s`);
    return NextResponse.json({
      theme: { ...theme, status: "provisioned" as const },
      warnings: warnings.length > 0 ? warnings.slice(0, 10) : undefined,
    });
  } else {
    await deprovisionCustomTheme(slug);
    const friendlyError = humanizeProvisionError(result.error ?? "Unknown error");
    console.error(`[upload] Provisioning error: ${result.error}`);
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
// humanizeProvisionError (shared logic — duplicated from route.ts to keep
// the upload route self-contained; could be extracted to a shared module)
// ---------------------------------------------------------------------------

function humanizeProvisionError(raw: string): string {
  if (/syntax error/i.test(raw)) {
    const near = raw.match(/at or near "([^"]+)"/)?.[1];
    return near
      ? `SQL syntax error near "${near}". The dialect converter may have produced invalid PostgreSQL syntax. ` +
          `Try selecting a different dialect or contact support.`
      : `SQL syntax error in the generated DDL. The dialect converter may need adjustments for this file.`;
  }

  if (/relation .+ already exists/i.test(raw)) {
    const table = raw.match(/relation "([^"]+)"/)?.[1];
    return `Table "${table ?? "unknown"}" already exists. Try using a different slug.`;
  }

  if (/type .+ does not exist/i.test(raw)) {
    const type = raw.match(/type "([^"]+)"/)?.[1];
    return `Unknown column type "${type ?? "unknown"}". The dialect converter missed a type conversion. ` +
      `Try a smaller file with the preview flow, so you can edit the DDL before submitting.`;
  }

  if (/column .+ does not exist/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Column "${col ?? "unknown"}" referenced in INSERT data doesn't match the table schema. ` +
      `The DDL and seed data may be out of sync.`;
  }

  if (/duplicate key value violates unique constraint/i.test(raw)) {
    const constraint = raw.match(/constraint "([^"]+)"/)?.[1];
    return `Duplicate key violates constraint "${constraint ?? "unknown"}". ` +
      `The seed data contains duplicate primary key values.`;
  }

  if (/violates foreign key constraint/i.test(raw)) {
    return `Seed data references a record that doesn't exist (foreign key violation). ` +
      `INSERT statements may need to be reordered so parent tables are populated first.`;
  }

  if (/violates not-null constraint/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Required column "${col ?? "unknown"}" received a NULL value in the seed data.`;
  }

  if (/disallowed SQL statement/i.test(raw)) {
    return `The SQL contains statements not allowed for security reasons. ` +
      `Only CREATE TABLE, CREATE INDEX, ALTER TABLE, and INSERT are permitted.`;
  }

  if (/statement timeout/i.test(raw)) {
    return `The SQL took too long to execute. The file may have too much seed data. ` +
      `Try reducing the number of INSERT rows.`;
  }

  if (/exceeds maximum length/i.test(raw)) {
    return `The generated SQL is too large to provision. Try reducing the amount of data in the export.`;
  }

  return `Database provisioning failed: ${raw}. Try a smaller export or a different dialect.`;
}
