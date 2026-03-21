/**
 * CSV-to-PostgreSQL converter.
 *
 * Accepts one or more CSV files (each representing a table), parses headers
 * and rows, infers column types, and generates PostgreSQL CREATE TABLE + INSERT
 * statements. Pure TypeScript, zero npm dependencies.
 */

import type { SchemaReference, TableInfo, ColumnInfo } from "@/content/schema/reference";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CsvFile {
  /** File name (used to derive table name). */
  readonly name: string;
  /** Raw CSV content as string. */
  readonly content: string;
}

export interface CsvConversionResult {
  readonly ddl: string;
  readonly seed: string;
  readonly schemaRef: SchemaReference;
  readonly warnings: readonly string[];
  readonly tables: readonly CsvTableSummary[];
}

export interface CsvTableSummary {
  readonly tableName: string;
  readonly columns: number;
  readonly rows: number;
}

// ---------------------------------------------------------------------------
// Column type inference
// ---------------------------------------------------------------------------

type InferredType = "integer" | "numeric" | "boolean" | "date" | "timestamp" | "text";

const INTEGER_RE = /^-?\d{1,18}$/;
const NUMERIC_RE = /^-?\d+\.\d+$/;
const BOOLEAN_RE = /^(true|false|t|f|yes|no|y|n|0|1)$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}(:\d{2})?)?$/;

function inferType(value: string): InferredType {
  if (value === "" || value.toLowerCase() === "null") {
    return "text"; // null/empty values don't constrain the type
  }
  if (INTEGER_RE.test(value)) return "integer";
  if (NUMERIC_RE.test(value)) return "numeric";
  if (BOOLEAN_RE.test(value)) return "boolean";
  if (TIMESTAMP_RE.test(value)) return "timestamp";
  if (DATE_RE.test(value)) return "date";
  return "text";
}

/** Resolve two types to the more general one. */
function widenType(a: InferredType, b: InferredType): InferredType {
  if (a === b) return a;
  if (a === "text" || b === "text") return "text";

  // integer + numeric → numeric
  if (
    (a === "integer" && b === "numeric") ||
    (a === "numeric" && b === "integer")
  ) {
    return "numeric";
  }

  // date + timestamp → timestamp
  if (
    (a === "date" && b === "timestamp") ||
    (a === "timestamp" && b === "date")
  ) {
    return "timestamp";
  }

  // Everything else falls back to text
  return "text";
}

function inferredTypeToPg(t: InferredType): string {
  switch (t) {
    case "integer":
      return "INTEGER";
    case "numeric":
      return "NUMERIC";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    case "timestamp":
      return "TIMESTAMP";
    case "text":
    default:
      return "TEXT";
  }
}

// ---------------------------------------------------------------------------
// CSV parser (RFC 4180 compliant)
// ---------------------------------------------------------------------------

interface ParsedCsv {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/**
 * Parse CSV content into headers + rows.
 * Handles quoted fields, embedded commas, newlines inside quotes, and
 * doubled-quote escapes (""). Auto-detects delimiter (comma, semicolon, tab).
 */
function parseCsv(content: string): ParsedCsv {
  // Normalize line endings
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (text.trim().length === 0) {
    return { headers: [], rows: [] };
  }

  // Auto-detect delimiter from first line
  const delimiter = detectDelimiter(text);

  const allRows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let wasQuoted = false;
  let i = 0;

  const pushField = () => {
    // Only trim unquoted fields; quoted fields preserve exact content
    current.push(wasQuoted ? field : field.trim());
    field = "";
    wasQuoted = false;
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // Not in quotes
    if (ch === '"' && field.length === 0) {
      inQuotes = true;
      wasQuoted = true;
      i++;
      continue;
    }

    if (ch === delimiter) {
      pushField();
      i++;
      continue;
    }

    if (ch === "\n") {
      pushField();
      if (current.some((f) => f.length > 0)) {
        allRows.push(current);
      }
      current = [];
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Last field/row
  pushField();
  if (current.some((f) => f.length > 0)) {
    allRows.push(current);
  }

  if (allRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = allRows[0];
  const rows = allRows.slice(1);

  return { headers, rows };
}

/**
 * Detect the delimiter used in the CSV from the first line.
 * Checks for tab, semicolon, then defaults to comma.
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  // Count occurrences of common delimiters outside quotes
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQ = false;
  for (const ch of firstLine) {
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && ch in counts) {
      counts[ch]++;
    }
  }

  // Prefer tab if it appears consistently, then semicolon, then comma
  if (counts["\t"] > 0 && counts["\t"] >= counts[","]) return "\t";
  if (counts[";"] > 0 && counts[";"] > counts[","]) return ";";
  return ",";
}

// ---------------------------------------------------------------------------
// Table name sanitization
// ---------------------------------------------------------------------------

function fileNameToTableName(fileName: string): string {
  // Strip common extensions
  let name = fileName.replace(/\.(csv|tsv|txt)$/i, "");
  // Convert to snake_case: replace non-alphanum with underscore, collapse
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  // Ensure it starts with a letter
  if (/^\d/.test(name)) {
    name = `t_${name}`;
  }
  return name || "imported_table";
}

function sanitizeColumnName(header: string): string {
  let name = header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (/^\d/.test(name)) {
    name = `col_${name}`;
  }
  return name || "column";
}

// ---------------------------------------------------------------------------
// SQL value escaping
// ---------------------------------------------------------------------------

function escapeSqlString(value: string): string {
  // PostgreSQL-style escaping: double single quotes
  return `'${value.replace(/'/g, "''")}'`;
}

function formatValue(value: string, type: InferredType): string {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null") {
    return "NULL";
  }

  switch (type) {
    case "integer":
      // Defense-in-depth: re-validate before emitting as unquoted literal
      return /^-?\d{1,18}$/.test(trimmed) ? trimmed : escapeSqlString(trimmed);
    case "numeric":
      return /^-?\d+(\.\d+)?$/.test(trimmed) ? trimmed : escapeSqlString(trimmed);
    case "boolean": {
      const lower = trimmed.toLowerCase();
      if (lower === "true" || lower === "t" || lower === "yes" || lower === "y" || lower === "1") {
        return "TRUE";
      }
      if (lower === "false" || lower === "f" || lower === "no" || lower === "n" || lower === "0") {
        return "FALSE";
      }
      return escapeSqlString(trimmed);
    }
    case "date":
    case "timestamp":
    case "text":
    default:
      return escapeSqlString(trimmed);
  }
}

// ---------------------------------------------------------------------------
// Main conversion
// ---------------------------------------------------------------------------

/** Max rows per INSERT batch to keep SQL manageable */
const INSERT_BATCH_SIZE = 100;

/** Max rows per table to prevent excessive SQL generation */
const MAX_ROWS_PER_TABLE = 5_000;

/** Max columns per table */
const MAX_COLS_PER_TABLE = 50;

/**
 * Convert one or more CSV files into PostgreSQL DDL + seed SQL.
 *
 * Each CSV file becomes one table. The first row is treated as headers.
 * Column types are inferred by scanning all values.
 */
export function convertCsvFiles(files: readonly CsvFile[]): CsvConversionResult {
  const warnings: string[] = [];
  const ddlParts: string[] = [];
  const seedParts: string[] = [];
  const tables: CsvTableSummary[] = [];
  const schemaRefTables: TableInfo[] = [];

  if (files.length === 0) {
    warnings.push("No CSV files provided.");
    return { ddl: "", seed: "", schemaRef: { tables: [] }, warnings, tables: [] };
  }

  // Track table names for uniqueness
  const usedTableNames = new Set<string>();

  for (const file of files) {
    const result = convertSingleCsv(file, usedTableNames, warnings);
    if (result) {
      ddlParts.push(result.ddl);
      if (result.seed) {
        seedParts.push(result.seed);
      }
      tables.push(result.summary);
      schemaRefTables.push(result.tableInfo);
      usedTableNames.add(result.summary.tableName);
    }
  }

  return {
    ddl: ddlParts.join("\n\n"),
    seed: seedParts.join("\n\n"),
    schemaRef: { tables: schemaRefTables },
    warnings,
    tables,
  };
}

interface SingleCsvResult {
  readonly ddl: string;
  readonly seed: string;
  readonly summary: CsvTableSummary;
  readonly tableInfo: TableInfo;
}

function convertSingleCsv(
  file: CsvFile,
  usedNames: ReadonlySet<string>,
  warnings: string[]
): SingleCsvResult | null {
  // Parse the CSV
  let parsed = parseCsv(file.content);

  if (parsed.headers.length === 0) {
    warnings.push(`"${file.name}": File is empty or has no headers — skipped.`);
    return null;
  }

  // Validate headers look like column names
  const hasValidHeaders = parsed.headers.every(
    (h) => h.length > 0 && h.length < 200
  );
  if (!hasValidHeaders) {
    warnings.push(
      `"${file.name}": Some headers are empty or extremely long. ` +
        `This may not be a valid CSV file. Attempting to proceed anyway.`
    );
  }

  if (parsed.headers.length > MAX_COLS_PER_TABLE) {
    warnings.push(
      `"${file.name}": CSV has ${parsed.headers.length} columns (max ${MAX_COLS_PER_TABLE}). ` +
        `Extra columns will be truncated.`
    );
    parsed = {
      headers: parsed.headers.slice(0, MAX_COLS_PER_TABLE),
      rows: parsed.rows.map((r) => r.slice(0, MAX_COLS_PER_TABLE)),
    };
  }

  if (parsed.rows.length > MAX_ROWS_PER_TABLE) {
    warnings.push(
      `"${file.name}": CSV has ${parsed.rows.length} rows — truncated to first ${MAX_ROWS_PER_TABLE}.`
    );
    parsed = { headers: parsed.headers, rows: parsed.rows.slice(0, MAX_ROWS_PER_TABLE) };
  }

  if (parsed.rows.length === 0) {
    warnings.push(
      `"${file.name}": CSV has headers but no data rows. ` +
        `Table will be created with no seed data.`
    );
  }

  // Derive table name
  let tableName = fileNameToTableName(file.name);
  if (usedNames.has(tableName)) {
    let suffix = 2;
    while (usedNames.has(`${tableName}_${suffix}`) && suffix <= 100) suffix++;
    if (suffix > 100) {
      warnings.push(`"${file.name}": Too many duplicate table names — skipped.`);
      return null;
    }
    tableName = `${tableName}_${suffix}`;
    warnings.push(`"${file.name}": Table name deduplicated to "${tableName}".`);
  }

  // Sanitize column names and deduplicate
  const columnNames: string[] = [];
  const usedCols = new Set<string>();
  for (const header of parsed.headers) {
    let col = sanitizeColumnName(header);
    if (usedCols.has(col)) {
      let suffix = 2;
      while (usedCols.has(`${col}_${suffix}`)) suffix++;
      col = `${col}_${suffix}`;
    }
    usedCols.add(col);
    columnNames.push(col);
  }

  // Infer types by scanning all rows
  const colCount = columnNames.length;
  const types: InferredType[] = new Array(colCount).fill("text") as InferredType[];
  const nonNullSeen: boolean[] = new Array(colCount).fill(false) as boolean[];

  for (const row of parsed.rows) {
    for (let c = 0; c < colCount; c++) {
      const value = (row[c] ?? "").trim();
      if (value === "" || value.toLowerCase() === "null") continue;

      const cellType = inferType(value);
      if (!nonNullSeen[c]) {
        types[c] = cellType;
        nonNullSeen[c] = true;
      } else {
        types[c] = widenType(types[c], cellType);
      }
    }
  }

  // Check for mismatched column counts
  let mismatchCount = 0;
  for (const row of parsed.rows) {
    if (row.length !== colCount) {
      mismatchCount++;
    }
  }
  if (mismatchCount > 0) {
    warnings.push(
      `"${file.name}": ${mismatchCount} row(s) have a different number of ` +
        `columns than the header (${colCount}). Extra values are ignored; ` +
        `missing values default to NULL.`
    );
  }

  // Build DDL: first column is auto-PK id if not already present
  const hasIdColumn = columnNames.some((c) => c === "id");
  const ddlColumns: string[] = [];
  if (!hasIdColumn) {
    ddlColumns.push('  "id" SERIAL PRIMARY KEY');
  }
  for (let c = 0; c < colCount; c++) {
    const pgType = inferredTypeToPg(types[c]);
    const quotedCol = `"${columnNames[c]}"`;
    const pkSuffix = hasIdColumn && columnNames[c] === "id" ? " PRIMARY KEY" : "";
    // If the column is "id" and all values are integers, use SERIAL
    if (columnNames[c] === "id" && types[c] === "integer") {
      ddlColumns.push(`  ${quotedCol} SERIAL${pkSuffix}`);
    } else {
      ddlColumns.push(`  ${quotedCol} ${pgType}${pkSuffix}`);
    }
  }

  // Quote all identifiers to prevent issues with reserved words and for defense-in-depth
  const quotedTable = `"${tableName}"`;
  const ddl = `CREATE TABLE ${quotedTable} (\n${ddlColumns.join(",\n")}\n);`;

  // Build INSERT statements in batches
  const seedChunks: string[] = [];
  for (let start = 0; start < parsed.rows.length; start += INSERT_BATCH_SIZE) {
    const batch = parsed.rows.slice(start, start + INSERT_BATCH_SIZE);
    const valueRows: string[] = [];

    for (const row of batch) {
      const values: string[] = [];
      for (let c = 0; c < colCount; c++) {
        const raw = (row[c] ?? "").trim();
        // For id SERIAL columns, use DEFAULT for empty/null so PG auto-assigns
        if (columnNames[c] === "id" && types[c] === "integer" && hasIdColumn) {
          if (raw === "" || raw.toLowerCase() === "null") {
            values.push("DEFAULT");
          } else {
            // Route through formatValue for proper validation/escaping
            values.push(formatValue(raw, types[c]));
          }
        } else {
          values.push(formatValue(raw, types[c]));
        }
      }
      valueRows.push(`(${values.join(", ")})`);
    }

    const insertCols = columnNames.map((c) => `"${c}"`).join(", ");
    seedChunks.push(
      `INSERT INTO ${quotedTable} (${insertCols}) VALUES\n${valueRows.join(",\n")};`
    );
  }

  const seed = seedChunks.join("\n\n");

  // Build schema ref
  const schemaColumns: ColumnInfo[] = [];
  if (!hasIdColumn) {
    schemaColumns.push({ name: "id", type: "serial", note: "PK, auto-generated" });
  }
  for (let c = 0; c < colCount; c++) {
    const pgType = inferredTypeToPg(types[c]).toLowerCase();
    const isId = columnNames[c] === "id" && types[c] === "integer";
    const notes: string[] = [];
    if (isId && hasIdColumn) notes.push("PK");
    schemaColumns.push({
      name: columnNames[c],
      type: isId ? "serial" : pgType,
      ...(notes.length > 0 ? { note: notes.join(", ") } : {}),
    });
  }

  const tableInfo: TableInfo = { name: tableName, columns: schemaColumns };
  const summary: CsvTableSummary = {
    tableName,
    columns: colCount + (hasIdColumn ? 0 : 1),
    rows: parsed.rows.length,
  };

  return { ddl, seed, summary, tableInfo };
}

// ---------------------------------------------------------------------------
// Content detection: is this likely a CSV file?
// ---------------------------------------------------------------------------

/**
 * Quick heuristic to determine if content looks like CSV data.
 * Returns a confidence score 0-1 and a reason string.
 */
export function detectCsvContent(
  content: string
): { readonly isCsv: boolean; readonly confidence: number; readonly reason: string } {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { isCsv: false, confidence: 0, reason: "File is empty" };
  }

  const lines = trimmed.split("\n").slice(0, 20); // Check first 20 lines
  if (lines.length < 2) {
    return { isCsv: false, confidence: 0.2, reason: "File has fewer than 2 lines" };
  }

  // Check for consistent delimiter usage
  const firstLine = lines[0];
  const delimiter = detectDelimiter(trimmed);
  const headerCount = countDelimitedFields(firstLine, delimiter);

  if (headerCount < 2) {
    return { isCsv: false, confidence: 0.1, reason: "First line has fewer than 2 delimited fields" };
  }

  // Check that subsequent lines have similar field counts
  let matchingLines = 0;
  for (let i = 1; i < lines.length; i++) {
    const fieldCount = countDelimitedFields(lines[i], delimiter);
    if (Math.abs(fieldCount - headerCount) <= 1) {
      matchingLines++;
    }
  }

  const consistency = matchingLines / (lines.length - 1);

  if (consistency >= 0.8) {
    return {
      isCsv: true,
      confidence: consistency,
      reason: `${headerCount} columns detected with ${Math.round(consistency * 100)}% row consistency`,
    };
  }

  return {
    isCsv: false,
    confidence: consistency * 0.5,
    reason: `Inconsistent column counts (${Math.round(consistency * 100)}% match)`,
  };
}

function countDelimitedFields(line: string, delimiter: string): number {
  let count = 1;
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes && ch === delimiter) count++;
  }
  return count;
}
