export const runtime = "nodejs";
export const maxDuration = 600;

import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";
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

/** Directory where import files are mounted */
const IMPORTS_DIR = path.resolve(process.cwd(), "imports");

/**
 * GET /api/custom-themes/import — list available .sql files in the imports directory
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await readdir(IMPORTS_DIR).catch(() => [] as string[]);
    const sqlFiles: Array<{ name: string; sizeMB: string }> = [];

    for (const entry of entries) {
      if (!/\.(sql|csv|tsv|txt)$/i.test(entry)) continue;
      try {
        const fileStat = await stat(path.join(IMPORTS_DIR, entry));
        if (fileStat.isFile()) {
          sqlFiles.push({
            name: entry,
            sizeMB: (fileStat.size / 1_000_000).toFixed(1),
          });
        }
      } catch {
        // Skip files we can't stat
      }
    }

    return NextResponse.json({ files: sqlFiles });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

/**
 * POST /api/custom-themes/import — import a .sql file from the imports directory
 *
 * Reads the file from the server filesystem (mounted Docker volume),
 * converts it, generates schema ref, and provisions — all server-side.
 * No HTTP body size limits since the file is read from disk.
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, slug, name, description, dialect } = body;

  // Validate inputs
  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json(
      { error: "fileName is required" },
      { status: 400 }
    );
  }

  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug. Use lowercase letters, numbers, and hyphens (3-50 chars)." },
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
      { error: `Invalid dialect. Supported: ${[...VALID_SQL_DIALECTS].join(", ")}` },
      { status: 400 }
    );
  }

  // Security: prevent directory traversal
  const safeName = path.basename(fileName);
  if (safeName !== fileName || fileName.includes("..")) {
    return NextResponse.json(
      { error: "Invalid file name" },
      { status: 400 }
    );
  }

  const filePath = path.join(IMPORTS_DIR, safeName);

  // Check slug availability
  const available = await isSlugAvailable(slug);
  if (!available) {
    return NextResponse.json(
      { error: "This slug is already in use" },
      { status: 409 }
    );
  }

  // Read the file from disk, handling UTF-16 encoding (common in SSMS exports)
  console.log(`[import] Reading file from disk: ${safeName}`);
  const readStart = Date.now();

  let rawSql: string;
  try {
    // First read raw bytes to detect encoding via BOM
    const rawBuffer = await readFile(filePath);
    const encoding = detectEncoding(rawBuffer);
    console.log(`[import] Detected encoding: ${encoding}`);

    if (encoding === "utf-16le") {
      rawSql = rawBuffer.toString("utf16le");
      // Strip UTF-16 LE BOM if present
      if (rawSql.charCodeAt(0) === 0xfeff) rawSql = rawSql.slice(1);
    } else if (encoding === "utf-16be") {
      // Node doesn't natively support utf-16be — swap bytes to LE
      for (let i = 0; i < rawBuffer.length - 1; i += 2) {
        const tmp = rawBuffer[i];
        rawBuffer[i] = rawBuffer[i + 1];
        rawBuffer[i + 1] = tmp;
      }
      rawSql = rawBuffer.toString("utf16le");
      if (rawSql.charCodeAt(0) === 0xfeff) rawSql = rawSql.slice(1);
    } else {
      rawSql = rawBuffer.toString("utf-8");
      // Strip UTF-8 BOM if present
      if (rawSql.charCodeAt(0) === 0xfeff) rawSql = rawSql.slice(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("ENOENT")) {
      return NextResponse.json(
        { error: `File "${safeName}" not found in the imports directory. Make sure it exists in the imports/ folder.` },
        { status: 404 }
      );
    }
    console.error(`[import] Failed to read file: ${msg}`);
    return NextResponse.json(
      { error: `Could not read file: ${msg}` },
      { status: 500 }
    );
  }

  const fileSizeMB = (rawSql.length / 1_000_000).toFixed(1);
  console.log(`[import] File read complete (${Date.now() - readStart}ms, ${fileSizeMB}MB, ${rawSql.length} chars)`);

  if (!rawSql.trim()) {
    return NextResponse.json(
      { error: "The file is empty." },
      { status: 400 }
    );
  }

  // For large files, split DDL and INSERT statements BEFORE conversion
  // to avoid running expensive regex replacements on hundreds of MB of INSERT data.
  // The converter processes each part separately, keeping memory usage manageable.
  const isLarge = rawSql.length > 50_000_000; // >50MB
  let schemaSql: string;
  let seedSql: string;
  let warnings: readonly string[];

  try {
    if (isLarge) {
      console.log(`[import] Large file (${fileSizeMB}MB) — splitting DDL and seed before conversion...`);
      const splitStart = Date.now();
      const { ddlPart, seedPart } = splitDdlAndSeed(rawSql);
      // Release the full raw string ASAP to free memory
      rawSql = "";
      console.log(
        `[import] Split complete (${Date.now() - splitStart}ms): ` +
          `DDL ${(ddlPart.length / 1000).toFixed(0)}KB, ` +
          `seed ${(seedPart.length / 1_000_000).toFixed(1)}MB`
      );

      // Convert DDL through the full converter (small, safe)
      console.log(`[import] Converting DDL (${dialect} → postgresql)...`);
      const ddlStart = Date.now();
      const ddlResult = convertSql(ddlPart, dialect as SqlDialect);
      schemaSql = ddlResult.ddl;
      warnings = ddlResult.warnings;
      console.log(`[import] DDL conversion complete (${Date.now() - ddlStart}ms)`);

      // Convert seed data with lightweight processing — for large files, we skip
      // the full converter pipeline (splitStatements is O(n) character-by-character
      // which is too slow for 400MB+) and instead do direct line-by-line conversion.
      console.log(`[import] Converting seed data (${(seedPart.length / 1_000_000).toFixed(1)}MB)...`);
      const seedStart = Date.now();
      if (seedPart.length > 100_000_000) {
        // Very large seed: do lightweight line-by-line conversion
        seedSql = convertSeedLightweight(seedPart, dialect as string);
        console.log(`[import] Seed conversion complete (lightweight, ${Date.now() - seedStart}ms)`);
      } else {
        const seedResult = convertSql(seedPart, dialect as SqlDialect);
        seedSql = seedResult.seed;
        warnings = [...warnings, ...seedResult.warnings];
        console.log(`[import] Seed conversion complete (${Date.now() - seedStart}ms)`);
      }
    } else {
      console.log(`[import] Converting ${dialect} → postgresql...`);
      const convertStart = Date.now();
      const result = convertSql(rawSql, dialect as SqlDialect);
      schemaSql = result.ddl;
      seedSql = result.seed;
      warnings = result.warnings;
      console.log(
        `[import] Conversion complete (${Date.now() - convertStart}ms): ` +
          `DDL ${(schemaSql.length / 1000).toFixed(0)}KB, ` +
          `seed ${(seedSql.length / 1000).toFixed(0)}KB, ` +
          `${warnings.length} warnings`
      );
    }
  } catch (convErr) {
    const msg = convErr instanceof Error ? convErr.message : String(convErr);
    console.error(`[import] Conversion crashed: ${msg}`);
    return NextResponse.json(
      {
        error:
          `SQL conversion failed: ${msg}. ` +
          `The file may be too large or contain unsupported SQL syntax.`,
      },
      { status: 500 }
    );
  }

  if (!schemaSql.trim()) {
    const warningText = warnings.length > 0
      ? ` Converter notes: ${warnings.slice(0, 3).join("; ")}`
      : "";
    return NextResponse.json(
      {
        error:
          `No CREATE TABLE statements found after converting from ${dialect}. ` +
          `Make sure the file contains table definitions (schema), not just data.${warningText}`,
      },
      { status: 422 }
    );
  }

  // Generate schema reference
  console.log("[import] Generating schema reference...");
  const schemaRef: SchemaReference = generateSchemaRef(schemaSql);

  if (schemaRef.tables.length === 0) {
    return NextResponse.json(
      {
        error: "Could not parse any table definitions from the converted SQL.",
      },
      { status: 422 }
    );
  }

  console.log(`[import] Schema ref: ${schemaRef.tables.length} tables`);

  // Create theme record
  console.log("[import] Creating theme record...");
  const theme = await createCustomTheme({
    orgId: org.id,
    slug,
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    schemaSql,
    seedSql,
    schemaRef,
    tableMapping: null,
    sourceDialect: dialect,
  });

  // Provision the database
  console.log(`[import] Provisioning database "${slug}"...`);
  const provisionStart = Date.now();
  const provisionResult = await provisionCustomTheme(slug, schemaSql, seedSql);
  console.log(
    `[import] Provisioning ${provisionResult.success ? "succeeded" : "failed"} (${Date.now() - provisionStart}ms)`
  );

  if (provisionResult.success) {
    await updateCustomThemeStatus(theme.id, "provisioned");
    const totalMs = Date.now() - readStart;
    console.log(`[import] Done! Total time: ${(totalMs / 1000).toFixed(1)}s`);
    return NextResponse.json({
      theme: { ...theme, status: "provisioned" as const },
      warnings: warnings.length > 0 ? warnings.slice(0, 10) : undefined,
    });
  } else {
    await deprovisionCustomTheme(slug);
    const friendlyError = humanizeProvisionError(provisionResult.error ?? "Unknown error");
    console.error(`[import] Provisioning error: ${provisionResult.error}`);

    // Log context around the error position for debugging.
    // We don't know whether the error is from schemaSql or seedSql (they run
    // as separate queries), so show both if the position is ambiguous.
    const posMatch = provisionResult.error?.match(/position:\s*(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      // Show DDL context
      if (pos < schemaSql.length) {
        const start = Math.max(0, pos - 200);
        const end = Math.min(schemaSql.length, pos + 200);
        console.error(`[import] DDL around position ${pos}:\n...${schemaSql.slice(start, end)}...`);
      }
      // Always show seed context too — the error position is relative to whichever query failed
      if (pos < seedSql.length) {
        const start = Math.max(0, pos - 200);
        const end = Math.min(seedSql.length, pos + 200);
        console.error(`[import] Seed around position ${pos}:\n...${seedSql.slice(start, end)}...`);
      }
      // Also show the very start of seed data for garbage detection
      console.error(`[import] Seed first 300 chars:\n${seedSql.slice(0, 300)}`);
    }
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
// humanizeProvisionError
// ---------------------------------------------------------------------------

function humanizeProvisionError(raw: string): string {
  if (/syntax error/i.test(raw)) {
    const near = raw.match(/at or near "([^"]+)"/)?.[1];
    return near
      ? `SQL syntax error near "${near}". The dialect converter may have produced invalid PostgreSQL.`
      : `SQL syntax error in the generated DDL.`;
  }
  if (/relation .+ already exists/i.test(raw)) {
    const table = raw.match(/relation "([^"]+)"/)?.[1];
    return `Table "${table ?? "unknown"}" already exists. Try a different slug.`;
  }
  if (/type .+ does not exist/i.test(raw)) {
    const type = raw.match(/type "([^"]+)"/)?.[1];
    return `Unknown column type "${type ?? "unknown"}". The converter missed a type mapping.`;
  }
  if (/column .+ does not exist/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Column "${col ?? "unknown"}" in INSERT doesn't match the table schema.`;
  }
  if (/duplicate key value violates unique constraint/i.test(raw)) {
    return `Duplicate primary key in seed data.`;
  }
  if (/violates foreign key constraint/i.test(raw)) {
    return `Foreign key violation — parent table data may be missing or INSERTs are in wrong order.`;
  }
  if (/violates not-null constraint/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/)?.[1];
    return `Required column "${col ?? "unknown"}" has NULL values in seed data.`;
  }
  if (/disallowed SQL statement/i.test(raw)) {
    return `SQL contains disallowed statements. Only CREATE TABLE, CREATE INDEX, ALTER TABLE, and INSERT are permitted.`;
  }
  if (/statement timeout/i.test(raw)) {
    return `SQL took too long to execute. Try reducing the amount of seed data.`;
  }
  if (/exceeds maximum length/i.test(raw)) {
    return `Generated SQL is too large to provision.`;
  }
  return `Provisioning failed: ${raw}`;
}

// ---------------------------------------------------------------------------
// Split DDL (CREATE/ALTER) from seed (INSERT) for memory-efficient processing
// ---------------------------------------------------------------------------

function splitDdlAndSeed(sql: string): { ddlPart: string; seedPart: string } {
  const ddlLines: string[] = [];
  const seedLines: string[] = [];

  // Process line by line to avoid creating huge intermediate arrays.
  // We classify each statement by its leading keyword.
  let pos = 0;
  let currentChunk = "";
  let currentIsSeed = false;

  while (pos < sql.length) {
    // Find end of line
    let eol = sql.indexOf("\n", pos);
    if (eol === -1) eol = sql.length;
    const line = sql.slice(pos, eol);
    pos = eol + 1;

    const trimmed = line.trimStart();
    const upper = trimmed.slice(0, 20).toUpperCase();

    // Detect statement boundaries
    if (
      upper.startsWith("CREATE ") ||
      upper.startsWith("ALTER ") ||
      upper.startsWith("SET ") ||
      upper.startsWith("USE ") ||
      upper.startsWith("GO") ||
      upper.startsWith("IF ") ||
      upper.startsWith("BEGIN") ||
      upper.startsWith("END") ||
      upper.startsWith("PRINT ") ||
      upper.startsWith("EXEC") ||
      upper.startsWith("DROP ")
    ) {
      // Flush previous chunk
      if (currentChunk) {
        if (currentIsSeed) seedLines.push(currentChunk);
        else ddlLines.push(currentChunk);
      }
      currentChunk = line + "\n";
      currentIsSeed = false;
    } else if (upper.startsWith("INSERT ")) {
      // Skip INSERT statements targeting @table_variables or #temp_tables —
      // these come from stored procedure bodies, not real data.
      if (/\bINSERT\s+(?:INTO\s+)?[@#]/i.test(trimmed)) {
        currentChunk += line + "\n";
        // Keep currentIsSeed unchanged — this is part of a proc body (DDL context)
      } else {
        // Flush previous chunk
        if (currentChunk) {
          if (currentIsSeed) seedLines.push(currentChunk);
          else ddlLines.push(currentChunk);
        }
        currentChunk = line + "\n";
        currentIsSeed = true;
      }
    } else {
      // Continuation of current statement
      currentChunk += line + "\n";
    }
  }

  // Flush last chunk
  if (currentChunk) {
    if (currentIsSeed) seedLines.push(currentChunk);
    else ddlLines.push(currentChunk);
  }

  return {
    ddlPart: ddlLines.join(""),
    seedPart: seedLines.join(""),
  };
}

// ---------------------------------------------------------------------------
// Encoding detection — handles UTF-16 exports from SSMS and other tools
// ---------------------------------------------------------------------------

function detectEncoding(buffer: Buffer): "utf-8" | "utf-16le" | "utf-16be" {
  if (buffer.length >= 2) {
    // UTF-16 LE BOM: FF FE
    if (buffer[0] === 0xff && buffer[1] === 0xfe) return "utf-16le";
    // UTF-16 BE BOM: FE FF
    if (buffer[0] === 0xfe && buffer[1] === 0xff) return "utf-16be";
  }
  // UTF-8 BOM: EF BB BF (still return utf-8)
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return "utf-8";
  }
  // No BOM — check for NUL bytes in first 100 bytes (heuristic for UTF-16 without BOM)
  if (buffer.length >= 20) {
    let nullAtOdd = 0;
    let nullAtEven = 0;
    const check = Math.min(buffer.length, 100);
    for (let i = 0; i < check; i++) {
      if (buffer[i] === 0) {
        if (i % 2 === 0) nullAtEven++;
        else nullAtOdd++;
      }
    }
    // UTF-16 LE: NUL bytes at odd positions (ASCII char + 0x00)
    if (nullAtOdd > check * 0.2) return "utf-16le";
    // UTF-16 BE: NUL bytes at even positions (0x00 + ASCII char)
    if (nullAtEven > check * 0.2) return "utf-16be";
  }
  return "utf-8";
}

// ---------------------------------------------------------------------------
// Lightweight seed conversion for very large files (>100MB of INSERT data)
// ---------------------------------------------------------------------------

/**
 * For very large seed portions (400MB+), the full converter's character-by-
 * character `splitStatements` is too expensive. This function does direct
 * line-by-line regex conversion without building intermediate arrays.
 *
 * It handles the most critical SQL Server → PostgreSQL transformations
 * that appear in INSERT statements:
 * - [bracket] quoting removal
 * - dbo. prefix removal
 * - N'string' → 'string'
 * - CAST(N'...' AS DateTime) → '...'::TIMESTAMP
 * - INSERT [table] → INSERT INTO table
 * - GO delimiter → semicolons
 */
function convertSeedLightweight(seed: string, dialect: string): string {
  if (dialect !== "sqlserver") {
    // For non-SQL Server, return seed as-is (basic cleanup only)
    return seed.replace(/\r\n/g, "\n");
  }

  const lines = seed.split("\n");
  const result: string[] = [];
  // Track when we're inside a skipped block (e.g., stored procedure body
  // that leaked into seed because it contains INSERT into @variables)
  let skipCurrentBlock = false;

  for (const rawLine of lines) {
    let line = rawLine;

    // Skip empty lines and SQL Server noise
    const trimmed = line.trimStart();
    if (!trimmed) continue;

    const upper = trimmed.slice(0, 10).toUpperCase();
    if (upper.startsWith("SET ") || upper.startsWith("GO")) continue;

    // Only process INSERT lines and their continuations
    if (upper.startsWith("INSERT")) {
      // Skip INSERT statements from stored procedure bodies that leaked into
      // seed data. These target @table_variables or #temp_tables — they are
      // T-SQL procedural code, not real data.
      if (/\bINSERT\s+(?:INTO\s+)?[@#]/i.test(trimmed)) {
        skipCurrentBlock = true;
        continue;
      }
      skipCurrentBlock = false;

      // Terminate the previous statement before starting a new INSERT.
      // In SSMS exports, GO delimits statements, but we stripped those —
      // PostgreSQL needs semicolons between statements.
      if (result.length > 0) {
        const lastIdx = result.length - 1;
        const last = result[lastIdx].trimEnd();
        if (!last.endsWith(";")) result[lastIdx] = last + ";";
      }

      // Remove [dbo]. prefix BEFORE bracket-to-quote conversion
      line = line.replace(/\[dbo\]\.\s*/gi, "");
      // Convert [bracket] quoting to "double-quoted" identifiers (preserves reserved words)
      line = line.replace(/\[([^\]]+)\]/g, '"$1"');
      // N'string' → 'string'  (greedy — lazy *? breaks on escaped '' like N'can''t')
      line = line.replace(/\bN'((?:[^']|'')*)'/g, "'$1'");
      // CAST(N'...' AS DateTime) → '...'::TIMESTAMP (N already stripped above)
      line = line.replace(
        /\bCAST\s*\(\s*'([^']*)'\s+AS\s+(?:DateTime2?|SmallDateTime|Date)\s*\)/gi,
        "'$1'::TIMESTAMP"
      );
      // CAST(value AS Decimal/Numeric(...)) → just the value
      line = line.replace(
        /\bCAST\s*\(\s*([.\d]+)\s+AS\s+(?:Decimal|Numeric)\s*\(\s*\d+\s*,\s*\d+\s*\)\s*\)/gi,
        "$1"
      );
      // GETDATE() → NOW()
      line = line.replace(/\bGETDATE\s*\(\s*\)/gi, "NOW()");
      // ISNULL(x, y) → COALESCE(x, y)
      line = line.replace(/\bISNULL\s*\(/gi, "COALESCE(");
      // 0xHEX binary literals → decode('HEX','hex')
      line = line.replace(/\b0x([0-9A-Fa-f]{2,})\b/g, "decode('$1','hex')");
      // Ensure INSERT INTO (SQL Server omits INTO)
      line = line.replace(/^(\s*)INSERT\s+(?!INTO\b)/i, "$1INSERT INTO ");
    } else if (skipCurrentBlock) {
      // Skip continuation lines of a stored-proc INSERT that we're filtering out
      continue;
    } else {
      // Continuation line (e.g. VALUES rows in multi-line INSERT statements).
      // Apply the same SQL Server→PG data transformations as the INSERT header.
      line = line.replace(/\[dbo\]\.\s*/gi, "");
      line = line.replace(/\[([^\]]+)\]/g, '"$1"');
      line = line.replace(/\bN'((?:[^']|'')*)'/g, "'$1'");
      line = line.replace(
        /\bCAST\s*\(\s*'([^']*)'\s+AS\s+(?:DateTime2?|SmallDateTime|Date)\s*\)/gi,
        "'$1'::TIMESTAMP"
      );
      line = line.replace(
        /\bCAST\s*\(\s*([.\d]+)\s+AS\s+(?:Decimal|Numeric)\s*\(\s*\d+\s*,\s*\d+\s*\)\s*\)/gi,
        "$1"
      );
      line = line.replace(/\bGETDATE\s*\(\s*\)/gi, "NOW()");
      line = line.replace(/\bISNULL\s*\(/gi, "COALESCE(");
      line = line.replace(/\b0x([0-9A-Fa-f]{2,})\b/g, "decode('$1','hex')");
    }

    result.push(line);
  }

  // Terminate the final statement
  if (result.length > 0) {
    const lastIdx = result.length - 1;
    const last = result[lastIdx].trimEnd();
    if (!last.endsWith(";")) result[lastIdx] = last + ";";
  }

  return result.join("\n");
}
