/**
 * Parse PostgreSQL CREATE TABLE statements and generate a SchemaReference.
 *
 * Extracts table names, column definitions (name, type, notes) including
 * primary keys, foreign keys, and unique constraints.
 */

import type { SchemaReference, TableInfo, ColumnInfo } from "@/content/schema/reference";

/**
 * Generate a SchemaReference from PostgreSQL DDL (CREATE TABLE statements).
 */
export function generateSchemaRef(pgDdl: string): SchemaReference {
  const tables: TableInfo[] = [];
  const tableBlocks = extractCreateTableBlocks(pgDdl);

  for (const block of tableBlocks) {
    const table = parseCreateTable(block);
    if (table) {
      tables.push(table);
    }
  }

  return { tables };
}

// ---------------------------------------------------------------------------
// Extract CREATE TABLE blocks
// ---------------------------------------------------------------------------

/**
 * Extract individual CREATE TABLE ... (...) blocks from DDL text.
 * Handles nested parentheses (e.g., CHECK constraints, type definitions).
 */
function extractCreateTableBlocks(ddl: string): readonly string[] {
  const blocks: string[] = [];
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(ddl)) !== null) {
    const startIdx = match.index;
    // Find the opening parenthesis
    const openParen = ddl.indexOf("(", match.index + match[0].length);
    if (openParen === -1) continue;

    // Find matching closing parenthesis, skipping string literals
    let depth = 1;
    let i = openParen + 1;
    let inString = false;
    while (i < ddl.length && depth > 0) {
      if (inString) {
        // Handle escaped quotes ('') inside string literals
        if (ddl[i] === "'" && ddl[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (ddl[i] === "'") inString = false;
      } else {
        if (ddl[i] === "'") inString = true;
        else if (ddl[i] === "(") depth++;
        else if (ddl[i] === ")") depth--;
      }
      i++;
    }

    if (depth === 0) {
      blocks.push(ddl.slice(startIdx, i));
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Parse a single CREATE TABLE block
// ---------------------------------------------------------------------------

function parseCreateTable(block: string): TableInfo | null {
  // Extract table name
  const nameMatch = block.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"([^"]+)"|(\w+))/i
  );
  if (!nameMatch) return null;
  const tableName = nameMatch[1] ?? nameMatch[2];

  // Extract the content between outermost parentheses
  const openParen = block.indexOf("(");
  const closeParen = block.lastIndexOf(")");
  if (openParen === -1 || closeParen === -1) return null;
  const body = block.slice(openParen + 1, closeParen);

  // Split body into lines, respecting nested parentheses
  const lines = splitColumnLines(body);

  // First pass: collect table-level constraints for annotation
  const tablePks = new Set<string>();
  const tableUniques = new Set<string>();
  const tableFks = new Map<string, string>(); // column → referenced table

  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();

    // Table-level PRIMARY KEY (col1, col2)
    const pkMatch = line.match(
      /PRIMARY\s+KEY\s*\(([^)]+)\)/i
    );
    if (pkMatch && trimmed.startsWith("PRIMARY")) {
      for (const col of pkMatch[1].split(",")) {
        tablePks.add(col.trim().replace(/"/g, ""));
      }
      continue;
    }

    // Table-level UNIQUE (col)
    const uniqueMatch = line.match(
      /UNIQUE\s*\(([^)]+)\)/i
    );
    if (uniqueMatch && (trimmed.startsWith("UNIQUE") || trimmed.startsWith("CONSTRAINT"))) {
      for (const col of uniqueMatch[1].split(",")) {
        tableUniques.add(col.trim().replace(/"/g, ""));
      }
      continue;
    }

    // Table-level FOREIGN KEY (col) REFERENCES table(col)
    const fkMatch = line.match(
      /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:"([^"]+)"|(\w+))/i
    );
    if (fkMatch) {
      const fkCol = fkMatch[1].trim().replace(/"/g, "");
      const refTable = fkMatch[2] ?? fkMatch[3];
      tableFks.set(fkCol, refTable);
    }
  }

  // Second pass: parse column definitions
  const columns: ColumnInfo[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Skip table-level constraints
    const upper = trimmed.toUpperCase();
    if (
      upper.startsWith("PRIMARY KEY") ||
      upper.startsWith("UNIQUE") ||
      upper.startsWith("FOREIGN KEY") ||
      upper.startsWith("CHECK") ||
      upper.startsWith("CONSTRAINT")
    ) {
      continue;
    }

    const col = parseColumnDef(trimmed, tablePks, tableUniques, tableFks);
    if (col) {
      columns.push(col);
    }
  }

  return { name: tableName, columns };
}

// ---------------------------------------------------------------------------
// Split column lines (respecting nested parens)
// ---------------------------------------------------------------------------

function splitColumnLines(body: string): readonly string[] {
  const lines: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    if (inString) {
      current += ch;
      if (ch === "'" && i + 1 < body.length && body[i + 1] === "'") {
        current += body[i + 1];
        i++;
        continue;
      }
      if (ch === "'") inString = false;
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === "(") depth++;
    if (ch === ")") depth--;

    if (ch === "," && depth === 0) {
      lines.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    lines.push(trimmed);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Parse a single column definition
// ---------------------------------------------------------------------------

function parseColumnDef(
  line: string,
  tablePks: ReadonlySet<string>,
  tableUniques: ReadonlySet<string>,
  tableFks: ReadonlyMap<string, string>
): ColumnInfo | null {
  // Match: column_name TYPE ...rest
  // Column name can be quoted or unquoted
  const match = line.match(
    /^(?:"([^"]+)"|(\w+))\s+(\w[\w\s(),.]*)/
  );
  if (!match) return null;

  const name = match[1] ?? match[2];
  const rest = match[3].trim();

  // Extract the type (first word or compound type like DOUBLE PRECISION, NUMERIC(10,4))
  const type = extractType(rest);

  // Build notes
  const notes: string[] = [];
  const upper = line.toUpperCase();

  // Primary key
  if (upper.includes("PRIMARY KEY") || tablePks.has(name)) {
    notes.push("PK");
  }

  // Serial types imply PK if not already noted
  if (/^(BIG)?SERIAL$/i.test(type) && !notes.includes("PK")) {
    notes.push("PK");
  }

  // Foreign key (inline)
  const refMatch = line.match(/REFERENCES\s+(?:"([^"]+)"|(\w+))/i);
  if (refMatch) {
    const refTable = refMatch[1] ?? refMatch[2];
    notes.push(`FK\u2192${refTable}`);
  } else if (tableFks.has(name)) {
    notes.push(`FK\u2192${tableFks.get(name)}`);
  }

  // Unique
  if (
    (upper.includes("UNIQUE") && !upper.includes("PRIMARY")) ||
    tableUniques.has(name)
  ) {
    notes.push("unique");
  }

  // Nullable detection — if NOT NULL is absent and not PK/SERIAL, note nullable
  // Actually, skip this — too noisy. Only note if CHECK constraint with values.
  const checkMatch = line.match(/CHECK\s*\([^)]*IN\s*\(([^)]+)\)/i);
  if (checkMatch) {
    const values = checkMatch[1]
      .split(",")
      .map((v) => v.trim().replace(/^'|'$/g, ""))
      .join("|");
    notes.push(values);
  }

  return {
    name,
    type: type.toLowerCase(),
    ...(notes.length > 0 ? { note: notes.join(", ") } : {}),
  };
}

// ---------------------------------------------------------------------------
// Extract type from rest of column definition
// ---------------------------------------------------------------------------

function extractType(rest: string): string {
  // Handle compound types
  const compoundMatch = rest.match(
    /^(DOUBLE\s+PRECISION|CHARACTER\s+VARYING|TIME\s+WITH\s+TIME\s+ZONE|TIMESTAMP\s+WITH\s+TIME\s+ZONE|TIMESTAMP\s+WITHOUT\s+TIME\s+ZONE)\b/i
  );
  if (compoundMatch) return compoundMatch[1];

  // Handle types with parameters: VARCHAR(255), NUMERIC(10,4)
  const paramMatch = rest.match(/^(\w+)\s*\(([^)]+)\)/);
  if (paramMatch) return `${paramMatch[1]}(${paramMatch[2]})`;

  // Simple type: first word
  const simpleMatch = rest.match(/^(\w+)/);
  return simpleMatch ? simpleMatch[1] : "TEXT";
}
