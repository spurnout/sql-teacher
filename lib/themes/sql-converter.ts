/**
 * SQL dialect detection and conversion to PostgreSQL.
 *
 * Pure TypeScript module with zero npm dependencies, usable in both
 * client (preview) and server (validation) contexts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SqlDialect = "postgresql" | "mysql" | "sqlite" | "sqlserver";

export interface ConversionResult {
  readonly dialect: SqlDialect;
  readonly ddl: string;
  readonly seed: string;
  readonly warnings: readonly string[];
}

export interface DetectionResult {
  readonly dialect: SqlDialect;
  readonly confidence: number;
  readonly signals: readonly string[];
}

// ---------------------------------------------------------------------------
// Dialect detection
// ---------------------------------------------------------------------------

interface DetectionRule {
  readonly pattern: RegExp;
  readonly dialect: SqlDialect;
  readonly weight: number;
  readonly label: string;
}

const DETECTION_RULES: readonly DetectionRule[] = [
  // MySQL signals
  { pattern: /`\w+`/g, dialect: "mysql", weight: 3, label: "backtick quoting" },
  { pattern: /\bENGINE\s*=/gi, dialect: "mysql", weight: 3, label: "ENGINE=" },
  { pattern: /\bAUTO_INCREMENT\b/gi, dialect: "mysql", weight: 3, label: "AUTO_INCREMENT" },
  { pattern: /\bDEFAULT\s+CHARSET\b/gi, dialect: "mysql", weight: 3, label: "DEFAULT CHARSET" },
  { pattern: /\bUNSIGNED\b/gi, dialect: "mysql", weight: 2, label: "UNSIGNED" },
  { pattern: /\/\*!\d+/g, dialect: "mysql", weight: 3, label: "MySQL conditional comment" },

  // SQLite signals
  { pattern: /\bAUTOINCREMENT\b/gi, dialect: "sqlite", weight: 3, label: "AUTOINCREMENT" },
  { pattern: /\bPRAGMA\b/gi, dialect: "sqlite", weight: 3, label: "PRAGMA" },
  { pattern: /\bBEGIN\s+TRANSACTION\b/gi, dialect: "sqlite", weight: 2, label: "BEGIN TRANSACTION" },
  { pattern: /\bdatetime\s*\(\s*'now'\s*\)/gi, dialect: "sqlite", weight: 3, label: "datetime('now')" },

  // SQL Server signals
  { pattern: /\[\w+\]/g, dialect: "sqlserver", weight: 3, label: "[bracket] quoting" },
  { pattern: /\bIDENTITY\s*\(/gi, dialect: "sqlserver", weight: 3, label: "IDENTITY(" },
  { pattern: /\bNVARCHAR\b/gi, dialect: "sqlserver", weight: 3, label: "NVARCHAR" },
  { pattern: /^\s*GO\s*$/gim, dialect: "sqlserver", weight: 3, label: "GO batch separator" },
  { pattern: /\bGETDATE\s*\(\s*\)/gi, dialect: "sqlserver", weight: 3, label: "GETDATE()" },
  { pattern: /\bSET\s+NOCOUNT\b/gi, dialect: "sqlserver", weight: 2, label: "SET NOCOUNT" },
  { pattern: /\bdbo\./gi, dialect: "sqlserver", weight: 2, label: "dbo. prefix" },

  // PostgreSQL signals
  { pattern: /\bSERIAL\b/gi, dialect: "postgresql", weight: 3, label: "SERIAL" },
  { pattern: /::/g, dialect: "postgresql", weight: 2, label: ":: cast" },
  { pattern: /\bRETURNING\b/gi, dialect: "postgresql", weight: 2, label: "RETURNING" },
  { pattern: /\bTIMESTAMPTZ\b/gi, dialect: "postgresql", weight: 3, label: "TIMESTAMPTZ" },
  { pattern: /\bJSONB\b/gi, dialect: "postgresql", weight: 2, label: "JSONB" },
];

/**
 * Detect the SQL dialect of a given SQL string using pattern scoring.
 */
export function detectDialect(sql: string): DetectionResult {
  const sample = sql.slice(0, 5000);
  const scores: Record<SqlDialect, number> = {
    postgresql: 0,
    mysql: 0,
    sqlite: 0,
    sqlserver: 0,
  };
  const signals: Record<SqlDialect, string[]> = {
    postgresql: [],
    mysql: [],
    sqlite: [],
    sqlserver: [],
  };

  for (const rule of DETECTION_RULES) {
    const matches = sample.match(rule.pattern);
    if (matches && matches.length > 0) {
      scores[rule.dialect] += rule.weight;
      signals[rule.dialect].push(rule.label);
    }
  }

  const entries = Object.entries(scores) as [SqlDialect, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topDialect, topScore] = entries[0];
  const totalScore = entries.reduce((sum, [, s]) => sum + s, 0);
  const confidence = totalScore > 0 ? topScore / totalScore : 0;

  return {
    dialect: topScore > 0 ? topDialect : "postgresql",
    confidence: topScore > 0 ? confidence : 0,
    signals: topScore > 0 ? signals[topDialect] : [],
  };
}

// ---------------------------------------------------------------------------
// Statement splitter (quote-aware)
// ---------------------------------------------------------------------------

/**
 * Split SQL text into individual statements, respecting string literals.
 * Returns trimmed, non-empty statements WITHOUT trailing semicolons.
 *
 * @param sql          The SQL text to split.
 * @param backslashEscape  When true, treat \' as an escaped quote inside
 *                         string literals (MySQL convention).  When false
 *                         (default), only '' is treated as an escape — this
 *                         is correct for PostgreSQL, SQLite, and SQL Server,
 *                         where backslash is a literal character (e.g. file
 *                         paths: N'C:\Data\file.mdf').
 */
function splitStatements(
  sql: string,
  backslashEscape = false,
): readonly string[] {
  const results: string[] = [];
  let current = "";
  let inString = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    if (inString) {
      current += ch;
      // Handle backslash-escaped quotes (\') — MySQL only
      if (
        backslashEscape &&
        ch === "\\" &&
        i + 1 < sql.length &&
        sql[i + 1] === "'"
      ) {
        current += sql[i + 1];
        i += 2;
        continue;
      }
      // Handle doubled-quote escapes ('') — standard SQL, all dialects
      if (ch === "'" && i + 1 < sql.length && sql[i + 1] === "'") {
        current += sql[i + 1];
        i += 2;
        continue;
      }
      if (ch === "'") {
        inString = false;
      }
      i++;
      continue;
    }

    // Not in string
    if (ch === "'") {
      inString = true;
      current += ch;
      i++;
      continue;
    }

    // Skip single-line comments
    if (ch === "-" && i + 1 < sql.length && sql[i + 1] === "-") {
      const eol = sql.indexOf("\n", i);
      i = eol === -1 ? sql.length : eol + 1;
      continue;
    }

    // Skip block comments (but not MySQL conditional comments handled elsewhere)
    if (ch === "/" && i + 1 < sql.length && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }

    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        results.push(trimmed);
      }
      current = "";
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    results.push(trimmed);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Statement classifier
// ---------------------------------------------------------------------------

type StatementKind = "ddl" | "seed" | "skip";

function classifyStatement(stmt: string): StatementKind {
  const upper = stmt.toUpperCase().trimStart();

  // ── DDL we want to keep ──
  if (
    upper.startsWith("CREATE TABLE") ||
    upper.startsWith("CREATE INDEX") ||
    upper.startsWith("CREATE UNIQUE INDEX") ||
    // SQL Server uses CLUSTERED/NONCLUSTERED before INDEX
    upper.startsWith("CREATE CLUSTERED INDEX") ||
    upper.startsWith("CREATE NONCLUSTERED INDEX") ||
    upper.startsWith("CREATE UNIQUE CLUSTERED INDEX") ||
    upper.startsWith("CREATE UNIQUE NONCLUSTERED INDEX")
  ) {
    return "ddl";
  }

  // ALTER TABLE is DDL — but not ALTER DATABASE (SQL Server settings)
  if (upper.startsWith("ALTER TABLE")) {
    return "ddl";
  }

  // ── Seed data ──
  if (upper.startsWith("INSERT")) {
    return "seed";
  }

  // Everything else is skipped: CREATE DATABASE, ALTER DATABASE,
  // CREATE FUNCTION, CREATE PROCEDURE, CREATE VIEW, CREATE TRIGGER,
  // IF blocks, EXEC, PRINT, DROP, etc.
  return "skip";
}

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

/**
 * Convert raw SQL from the given dialect to PostgreSQL.
 *
 * Returns detailed warnings when the input doesn't look like a database dump,
 * so users get explanatory feedback rather than an empty result.
 */
export function convertSql(
  rawSql: string,
  dialect: SqlDialect
): ConversionResult {
  // Pre-flight validation: catch obviously non-SQL input early
  const preflightIssue = preflightCheck(rawSql);
  if (preflightIssue) {
    return {
      dialect,
      ddl: "",
      seed: "",
      warnings: [preflightIssue],
    };
  }

  switch (dialect) {
    case "mysql":
      return convertMysql(rawSql);
    case "sqlite":
      return convertSqlite(rawSql);
    case "sqlserver":
      return convertSqlServer(rawSql);
    case "postgresql":
    default:
      return convertPostgresql(rawSql);
  }
}

/**
 * Quick checks on raw input to catch non-SQL files before conversion.
 * Returns an error message string if the input fails, or null if OK.
 */
function preflightCheck(rawSql: string): string | null {
  if (rawSql.trim().length === 0) {
    return "The file is empty. Expected a SQL dump with CREATE TABLE and/or INSERT statements.";
  }

  // Detect binary content (NUL bytes or high ratio of non-printable chars)
  const sample = rawSql.slice(0, 2048);
  let controlChars = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      controlChars++;
    }
  }
  if (controlChars > sample.length * 0.05) {
    return (
      "This file appears to be binary (not plain-text SQL). " +
      "Please export your database as a plain-text .sql file. " +
      "Binary backup formats (e.g., pg_dump custom format, MySQL frm files) are not supported."
    );
  }

  // Check for at least one SQL keyword in the first 5KB
  const head = rawSql.slice(0, 5000).toUpperCase();
  const hasSqlKeyword =
    /\b(CREATE\s+TABLE|CREATE\s+(UNIQUE\s+)?(NON)?CLUSTERED\s+INDEX|CREATE\s+INDEX|INSERT\s+INTO|INSERT\s+\[|ALTER\s+TABLE|DROP\s+TABLE|SELECT\b|BEGIN|PRAGMA)\b/.test(head);
  if (!hasSqlKeyword) {
    // Check if it looks like CSV — use a stricter heuristic:
    // consistent delimiter-separated fields across multiple lines
    const lines = rawSql.split("\n").slice(0, 10).filter((l) => l.trim().length > 0);
    if (lines.length >= 2) {
      const delimCounts = lines.map((l) => (l.match(/,/g) ?? []).length);
      const avgDelims = delimCounts.reduce((a, b) => a + b, 0) / delimCounts.length;
      const consistent = delimCounts.every((c) => Math.abs(c - avgDelims) <= 1);
      if (avgDelims >= 1 && consistent) {
        return (
          "This file looks like CSV data, not SQL. " +
          'Use the "CSV Files" tab to import CSV files instead.'
        );
      }
    }
    // Check if it looks like JSON
    if (rawSql.trimStart().startsWith("{") || rawSql.trimStart().startsWith("[")) {
      return (
        "This file looks like JSON, not SQL. " +
        "Please upload a .sql file containing CREATE TABLE and INSERT statements."
      );
    }
    // Check if it looks like XML/HTML
    if (rawSql.trimStart().startsWith("<")) {
      return (
        "This file looks like XML or HTML, not SQL. " +
        "Please upload a .sql file containing CREATE TABLE and INSERT statements."
      );
    }
    return (
      "No SQL statements found in the first portion of the file. " +
      "Expected a database dump containing CREATE TABLE and/or INSERT INTO statements. " +
      "If the file uses a non-standard format, try a different SQL dialect."
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// PostgreSQL pass-through
// ---------------------------------------------------------------------------

function convertPostgresql(rawSql: string): ConversionResult {
  const warnings: string[] = [];

  // Strip psql meta-commands
  let cleaned = rawSql.replace(/^\\connect\b.*$/gm, "");
  cleaned = cleaned.replace(/^\\set\b.*$/gim, "");
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n");

  const stmts = splitStatements(cleaned);
  const ddlParts: string[] = [];
  const seedParts: string[] = [];

  for (const stmt of stmts) {
    const kind = classifyStatement(stmt);
    if (kind === "ddl") {
      ddlParts.push(stmt + ";");
    } else if (kind === "seed") {
      seedParts.push(stmt + ";");
    } else if (stmt.trim().length > 0) {
      const preview = stmt.slice(0, 60);
      warnings.push(`Skipped statement: ${preview}${stmt.length > 60 ? "..." : ""}`);
    }
  }

  return {
    dialect: "postgresql",
    ddl: ddlParts.join("\n\n"),
    seed: seedParts.join("\n\n"),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// MySQL → PostgreSQL
// ---------------------------------------------------------------------------

function convertMysql(rawSql: string): ConversionResult {
  const warnings: string[] = [];

  let sql = rawSql.replace(/\r\n/g, "\n");

  // Strip MySQL conditional comments entirely (security: do not extract
  // their content into the statement stream — they can contain arbitrary SQL)
  sql = sql.replace(/\/\*!\d+[\s\S]*?\*\//g, "");

  // Remove SET statements at top of dump
  sql = sql.replace(
    /^\s*SET\s+(@|NAMES|character_set|sql_mode|time_zone|unique_checks|foreign_key_checks|sql_notes)\b[^;]*;\s*$/gim,
    ""
  );

  // Remove LOCK/UNLOCK TABLES
  sql = sql.replace(/^\s*(LOCK|UNLOCK)\s+TABLES\b[^;]*;\s*$/gim, "");

  const stmts = splitStatements(sql, true /* backslashEscape — MySQL uses \' */);
  const ddlParts: string[] = [];
  const seedParts: string[] = [];

  for (const stmt of stmts) {
    const kind = classifyStatement(stmt);
    if (kind === "ddl") {
      ddlParts.push(convertMysqlDdl(stmt, warnings) + ";");
    } else if (kind === "seed") {
      seedParts.push(convertMysqlDml(stmt) + ";");
    } else {
      if (stmt.trim().length > 0) {
        warnings.push(`Skipped: ${stmt.slice(0, 60)}...`);
      }
    }
  }

  return {
    dialect: "mysql",
    ddl: ddlParts.join("\n\n"),
    seed: seedParts.join("\n\n"),
    warnings,
  };
}

function convertMysqlDdl(stmt: string, warnings: string[]): string {
  let s = stmt;

  // Remove backtick quoting
  s = s.replace(/`(\w+)`/g, "$1");

  // AUTO_INCREMENT on column → SERIAL (for integer primary keys)
  // Handle any ordering of UNSIGNED / NOT NULL before AUTO_INCREMENT
  s = s.replace(
    /\b(INT|INTEGER|BIGINT|SMALLINT|MEDIUMINT)\b(\s*\(\d+\))?(\s+(?:UNSIGNED|NOT\s+NULL))*\s+AUTO_INCREMENT/gi,
    (match) => {
      if (/BIGINT/i.test(match)) return "BIGSERIAL";
      if (/SMALLINT/i.test(match)) return "SMALLSERIAL";
      return "SERIAL";
    }
  );

  // Strip display widths from integer types: INT(11) → INTEGER
  s = s.replace(/\bTINYINT\s*\(\s*1\s*\)/gi, "BOOLEAN");
  s = s.replace(/\bTINYINT\b(\s*\(\s*\d+\s*\))?/gi, "SMALLINT");
  s = s.replace(/\bMEDIUMINT\b(\s*\(\s*\d+\s*\))?/gi, "INTEGER");
  s = s.replace(/\bINT\b(\s*\(\s*\d+\s*\))/gi, "INTEGER");
  s = s.replace(/\bBIGINT\b(\s*\(\s*\d+\s*\))/gi, "BIGINT");

  // DOUBLE → DOUBLE PRECISION
  s = s.replace(/\bDOUBLE\b(?!\s+PRECISION)/gi, "DOUBLE PRECISION");
  s = s.replace(/\bFLOAT\b(\s*\(\s*\d+\s*,\s*\d+\s*\))?/gi, "REAL");

  // DATETIME → TIMESTAMP
  s = s.replace(/\bDATETIME\b/gi, "TIMESTAMP");

  // LONGTEXT, MEDIUMTEXT, TINYTEXT → TEXT
  s = s.replace(/\b(LONG|MEDIUM|TINY)TEXT\b/gi, "TEXT");

  // LONGBLOB, MEDIUMBLOB, TINYBLOB, BLOB → BYTEA
  s = s.replace(/\b(LONG|MEDIUM|TINY)?BLOB\b/gi, "BYTEA");

  // ENUM('a','b') → TEXT (with warning about CHECK constraint)
  // Use iterative balanced-paren matching to handle multi-line ENUM definitions
  s = replaceEnumTypes(s, warnings);

  // Remove UNSIGNED
  s = s.replace(/\bUNSIGNED\b/gi, "");

  // Remove ON UPDATE CURRENT_TIMESTAMP
  s = s.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, "");

  // Remove ENGINE=... clause (may appear on next line after closing paren)
  s = s.replace(/\)\s*ENGINE\s*=\s*\w+[^;]*/gi, ")");
  // Also handle standalone ENGINE lines not immediately after )
  s = s.replace(/^\s*ENGINE\s*=\s*\w+[^;\n]*/gim, "");

  // Remove DEFAULT CHARSET=...
  s = s.replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, "");

  // Remove COLLATE ...
  s = s.replace(/\bCOLLATE\s+\w+/gi, "");

  // Remove AUTO_INCREMENT=N table option
  s = s.replace(/\bAUTO_INCREMENT\s*=\s*\d+/gi, "");

  // Remove CHARACTER SET ...
  s = s.replace(/\bCHARACTER\s+SET\s+\w+/gi, "");

  // CURRENT_TIMESTAMP() → CURRENT_TIMESTAMP
  s = s.replace(/\bCURRENT_TIMESTAMP\s*\(\s*\)/gi, "CURRENT_TIMESTAMP");

  // Clean up double spaces and trailing commas before closing paren
  s = s.replace(/,\s*\)/g, "\n)");
  s = s.replace(/  +/g, " ");

  // Safety: catch any leftover AUTO_INCREMENT that the regex missed
  if (/\bAUTO_INCREMENT\b/i.test(s)) {
    s = s.replace(/\s*AUTO_INCREMENT\b/gi, "");
    warnings.push(
      "Residual AUTO_INCREMENT removed. The column may need SERIAL type — check the DDL."
    );
  }

  return s;
}

/** Replace ENUM(...) with TEXT, handling multi-line enum value lists. */
function replaceEnumTypes(sql: string, warnings: string[]): string {
  const enumRe = /\bENUM\s*\(/gi;
  let result = "";
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = enumRe.exec(sql)) !== null) {
    result += sql.slice(lastIdx, match.index);
    // Find matching closing paren
    let depth = 1;
    let j = match.index + match[0].length;
    while (j < sql.length && depth > 0) {
      if (sql[j] === "(") depth++;
      else if (sql[j] === ")") depth--;
      j++;
    }
    const enumBody = sql.slice(match.index + match[0].length, j - 1);
    warnings.push(
      `ENUM converted to TEXT. Consider adding CHECK constraint for values: ${enumBody.replace(/\s+/g, " ").trim()}`
    );
    result += "TEXT";
    lastIdx = j;
  }

  result += sql.slice(lastIdx);
  return result;
}

function convertMysqlDml(stmt: string): string {
  let s = stmt;
  // Remove backtick quoting
  s = s.replace(/`(\w+)`/g, "$1");
  return s;
}

// ---------------------------------------------------------------------------
// SQLite → PostgreSQL
// ---------------------------------------------------------------------------

function convertSqlite(rawSql: string): ConversionResult {
  const warnings: string[] = [];

  let sql = rawSql.replace(/\r\n/g, "\n");

  // Remove PRAGMA statements
  sql = sql.replace(/^\s*PRAGMA\b[^;]*;\s*$/gim, "");

  // Remove BEGIN TRANSACTION / COMMIT wrappers
  sql = sql.replace(/^\s*BEGIN\s+TRANSACTION\s*;\s*$/gim, "");
  sql = sql.replace(/^\s*BEGIN\s*;\s*$/gim, "");
  sql = sql.replace(/^\s*COMMIT\s*;\s*$/gim, "");

  // Remove DELETE FROM (SQLite dumps sometimes start with DELETE)
  sql = sql.replace(/^\s*DELETE\s+FROM\b[^;]*;\s*$/gim, "");

  const stmts = splitStatements(sql);
  const ddlParts: string[] = [];
  const seedParts: string[] = [];

  for (const stmt of stmts) {
    const kind = classifyStatement(stmt);
    if (kind === "ddl") {
      ddlParts.push(convertSqliteDdl(stmt, warnings) + ";");
    } else if (kind === "seed") {
      seedParts.push(stmt + ";");
    } else {
      if (stmt.trim().length > 0) {
        warnings.push(`Skipped: ${stmt.slice(0, 60)}...`);
      }
    }
  }

  return {
    dialect: "sqlite",
    ddl: ddlParts.join("\n\n"),
    seed: seedParts.join("\n\n"),
    warnings,
  };
}

function convertSqliteDdl(stmt: string, warnings: string[]): string {
  let s = stmt;

  // INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
  s = s.replace(
    /\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi,
    "SERIAL PRIMARY KEY"
  );

  // INTEGER PRIMARY KEY (without AUTOINCREMENT) → SERIAL PRIMARY KEY
  // (SQLite uses this as implicit rowid alias)
  s = s.replace(
    /\bINTEGER\s+PRIMARY\s+KEY\b(?!\s+AUTOINCREMENT)/gi,
    "SERIAL PRIMARY KEY"
  );

  // REAL → DOUBLE PRECISION
  s = s.replace(/\bREAL\b/gi, "DOUBLE PRECISION");

  // BLOB → BYTEA
  s = s.replace(/\bBLOB\b/gi, "BYTEA");

  // datetime('now') → NOW()
  s = s.replace(/\bdatetime\s*\(\s*'now'\s*\)/gi, "NOW()");

  // SQLite IF NOT EXISTS → keep (valid in PG)

  // Check for untyped columns (just a name with no type)
  // This is a rough heuristic — columns with only a name and optional constraints
  const lines = s.split("\n");
  const converted = lines.map((line) => {
    const trimmed = line.trim();
    // Skip non-column lines (CREATE TABLE, constraints, closing paren)
    if (
      /^(CREATE|PRIMARY|UNIQUE|FOREIGN|CHECK|CONSTRAINT|\)|$)/i.test(trimmed)
    ) {
      return line;
    }
    // If line has column name but no recognizable type keyword, add TEXT
    const colMatch = trimmed.match(
      /^(\w+)\s+(NOT\s+NULL|DEFAULT|PRIMARY|UNIQUE|CHECK|REFERENCES|,|$)/i
    );
    if (colMatch) {
      warnings.push(`Column "${colMatch[1]}" has no type, defaulting to TEXT`);
      return line.replace(
        /^(\s*)(\w+)(\s+)/,
        `$1$2 TEXT$3`
      );
    }
    return line;
  });
  s = converted.join("\n");

  return s;
}

// ---------------------------------------------------------------------------
// SQL Server → PostgreSQL
// ---------------------------------------------------------------------------

function convertSqlServer(rawSql: string): ConversionResult {
  const warnings: string[] = [];

  let sql = rawSql.replace(/\r\n/g, "\n");

  // Replace GO batch separators with semicolons so splitStatements can find boundaries
  sql = sql.replace(/^\s*GO\s*$/gim, ";");

  // Remove SET statements (SET ANSI_NULLS, SET QUOTED_IDENTIFIER, etc.)
  sql = sql.replace(
    /^\s*SET\s+(IDENTITY_INSERT|NOCOUNT|ANSI_NULLS|QUOTED_IDENTIFIER|ANSI_PADDING|ANSI_WARNINGS|CONCAT_NULL_YIELDS_NULL|ARITHABORT|NUMERIC_ROUNDABORT)\b[^;]*;?\s*$/gim,
    ""
  );

  // Remove USE [database]
  sql = sql.replace(/^\s*USE\s+\[?\w+\]?\s*;?\s*$/gim, "");

  // Remove SSMS script comment headers: /****** Object: ... Script Date: ... ******/
  // These can span multiple lines, so use [\s\S] instead of . to match newlines.
  sql = sql.replace(/\/\*{5,}[\s\S]*?\*{5,}\//g, "");

  // splitStatements with backslashEscape=false — SQL Server does NOT use \'
  // as an escape sequence.  Backslash is a literal character (e.g. file paths
  // in CREATE DATABASE, string manipulation in functions).
  const stmts = splitStatements(sql);
  const ddlParts: string[] = [];
  const seedParts: string[] = [];
  let skippedCount = 0;

  for (const stmt of stmts) {
    const kind = classifyStatement(stmt);
    if (kind === "ddl") {
      ddlParts.push(convertSqlServerDdl(stmt, warnings) + ";");
    } else if (kind === "seed") {
      seedParts.push(convertSqlServerDml(stmt) + ";");
    } else {
      if (stmt.trim().length > 0) {
        skippedCount++;
        // Only log first few skipped statements to avoid thousands of warnings
        if (skippedCount <= 10) {
          warnings.push(`Skipped: ${stmt.slice(0, 80)}${stmt.length > 80 ? "..." : ""}`);
        }
      }
    }
  }

  if (skippedCount > 10) {
    warnings.push(`...and ${skippedCount - 10} more skipped statements (views, functions, procedures, etc.)`);
  }

  return {
    dialect: "sqlserver",
    ddl: ddlParts.join("\n\n"),
    seed: seedParts.join("\n\n"),
    warnings,
  };
}

function convertSqlServerDdl(stmt: string, _warnings: string[]): string {
  let s = stmt;

  // ── Phase 1: Storage directives (brackets still present) ──
  // Filegroup refs use ON [PRIMARY] (single bracketed word not followed by .[),
  // while table refs use ON [dbo].[table] (schema-qualified with dots).

  // Remove TEXTIMAGE_ON [filegroup]
  s = s.replace(/\bTEXTIMAGE_ON\s+\[\w+\]/gi, "");

  // Remove ) ON [filegroup] — not followed by .[ (schema.table)
  s = s.replace(/\)\s*ON\s+\[\w+\](?!\s*\.\s*\[)/gim, ")");
  // Remove standalone ON [filegroup] at end of line
  s = s.replace(/\bON\s+\[\w+\](?!\s*\.\s*\[)\s*$/gim, "");

  // Remove INCLUDE([...]) covering index columns
  s = replaceBalancedParen(s, /\bINCLUDE\s*\(/gi);

  // Remove WITH (PAD_INDEX = ..., ...) storage option clauses
  s = replaceBalancedParen(s, /\bWITH\s*\(/gi);

  // ── Phase 2: Type conversions using positional matching ──
  // In SQL Server DDL, column defs follow the pattern: [col_name] [type_name].
  // By matching `] [type]` (type after column name's closing bracket), we avoid
  // accidentally converting column names that match SQL keywords — e.g. a
  // column named [DateTime] won't be converted, but the type [datetime] will.
  //
  // Pattern: (]) followed by whitespace then [type], preserving the `]` in $1.

  // IDENTITY(1,1) on integer columns → SERIAL
  s = s.replace(
    /(\])\s+\[(INT|INTEGER|BIGINT|SMALLINT)\]\s+IDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi,
    (_match, bracket, typeName) => {
      if (/BIGINT/i.test(typeName)) return bracket + " BIGSERIAL";
      if (/SMALLINT/i.test(typeName)) return bracket + " SMALLSERIAL";
      return bracket + " SERIAL";
    }
  );

  // String types
  s = s.replace(/(\])\s+\[nvarchar\]\s*\(\s*MAX\s*\)/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[nvarchar\]\s*\((\d+)\)/gi, "$1 VARCHAR($2)");
  s = s.replace(/(\])\s+\[varchar\]\s*\(\s*MAX\s*\)/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[varchar\]\s*\((\d+)\)/gi, "$1 VARCHAR($2)");
  s = s.replace(/(\])\s+\[ntext\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[nchar\]\s*\((\d+)\)/gi, "$1 CHAR($2)");
  s = s.replace(/(\])\s+\[char\]\s*\((\d+)\)/gi, "$1 CHAR($2)");
  s = s.replace(/(\])\s+\[text\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[xml\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[sql_variant\]/gi, "$1 TEXT");

  // Boolean
  s = s.replace(/(\])\s+\[bit\]/gi, "$1 BOOLEAN");

  // Date/time
  s = s.replace(/(\])\s+\[datetime2\](\s*\(\s*\d+\s*\))?/gi, "$1 TIMESTAMP");
  s = s.replace(/(\])\s+\[datetime\]/gi, "$1 TIMESTAMP");
  s = s.replace(/(\])\s+\[smalldatetime\]/gi, "$1 TIMESTAMP");
  s = s.replace(/(\])\s+\[date\]/gi, "$1 DATE");
  s = s.replace(/(\])\s+\[time\](\s*\(\s*\d+\s*\))?/gi, "$1 TIME");

  // Monetary
  s = s.replace(/(\])\s+\[smallmoney\]/gi, "$1 NUMERIC(10,4)");
  s = s.replace(/(\])\s+\[money\]/gi, "$1 NUMERIC(19,4)");

  // Numeric
  s = s.replace(/(\])\s+\[decimal\]\s*\((\d+)\s*,\s*(\d+)\)/gi, "$1 DECIMAL($2,$3)");
  s = s.replace(/(\])\s+\[decimal\]/gi, "$1 DECIMAL");
  s = s.replace(/(\])\s+\[numeric\]\s*\((\d+)\s*,\s*(\d+)\)/gi, "$1 NUMERIC($2,$3)");
  s = s.replace(/(\])\s+\[numeric\]/gi, "$1 NUMERIC");
  s = s.replace(/(\])\s+\[bigint\]/gi, "$1 BIGINT");
  s = s.replace(/(\])\s+\[smallint\]/gi, "$1 SMALLINT");
  s = s.replace(/(\])\s+\[tinyint\]/gi, "$1 SMALLINT");
  s = s.replace(/(\])\s+\[int\]/gi, "$1 INTEGER");
  s = s.replace(/(\])\s+\[float\]/gi, "$1 DOUBLE PRECISION");
  s = s.replace(/(\])\s+\[real\]/gi, "$1 REAL");

  // Special types
  s = s.replace(/(\])\s+\[uniqueidentifier\]/gi, "$1 UUID");
  s = s.replace(/(\])\s+\[image\]/gi, "$1 BYTEA");
  s = s.replace(/(\])\s+\[varbinary\]\s*\(\s*MAX\s*\)/gi, "$1 BYTEA");
  s = s.replace(/(\])\s+\[varbinary\]\s*\((\d+)\)/gi, "$1 BYTEA");
  s = s.replace(/(\])\s+\[binary\]\s*\((\d+)\)/gi, "$1 BYTEA");
  s = s.replace(/(\])\s+\[hierarchyid\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[geography\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[geometry\]/gi, "$1 TEXT");
  s = s.replace(/(\])\s+\[timestamp\]/gi, "$1 BYTEA"); // SQL Server timestamp = rowversion

  // ── Phase 3: Convert remaining brackets to double-quoted identifiers ──
  // SQL Server [brackets] → PostgreSQL "double quotes" to preserve reserved-word
  // identifiers like [Order], [DateTime], [Type], [Status], etc.

  // Remove [dbo]. schema prefix BEFORE bracket-to-quote conversion
  s = s.replace(/\[dbo\]\.\s*/gi, "");
  // Convert remaining bracketed identifiers to double-quoted
  s = s.replace(/\[([^\]]+)\]/g, '"$1"');

  // Remove any leftover bare dbo. references
  s = s.replace(/\bdbo\.\s*/gi, "");

  // ── Phase 4: DDL keyword cleanup ──

  // GETDATE() → NOW()
  s = s.replace(/\bGETDATE\s*\(\s*\)/gi, "NOW()");
  // NEWID() → gen_random_uuid()
  s = s.replace(/\bNEWID\s*\(\s*\)/gi, "gen_random_uuid()");

  // Remove CLUSTERED / NONCLUSTERED keywords
  s = s.replace(/\bNONCLUSTERED\b/gi, "");
  s = s.replace(/\bCLUSTERED\b/gi, "");

  // Strip ASC/DESC from column lists in PRIMARY KEY, UNIQUE, and INDEX defs
  // Handles both double-quoted identifiers ("Col" ASC) and bare identifiers (Col ASC)
  s = s.replace(/("[^"]+?"|\w+)\s+(?:ASC|DESC)\b/gi, "$1");

  // N'string' → 'string'
  s = s.replace(/\bN'((?:[^']|'')*?)'/g, "'$1'");

  // Clean up double/triple spaces and excessive blank lines
  s = s.replace(/  +/g, " ");
  s = s.replace(/\n\s*\n\s*\n/g, "\n\n");

  return s;
}

function convertSqlServerDml(stmt: string): string {
  let s = stmt;

  // Remove [dbo]. prefix BEFORE bracket-to-quote conversion
  s = s.replace(/\[dbo\]\.\s*/gi, "");
  // Convert [bracket] quoting to "double-quoted" identifiers (preserves reserved words)
  s = s.replace(/\[([^\]]+)\]/g, '"$1"');

  // Remove any leftover bare dbo. prefix
  s = s.replace(/\bdbo\.\s*/gi, "");

  // N'string' → 'string'
  s = s.replace(/\bN'((?:[^']|'')*?)'/g, "'$1'");

  // CAST(N'2019-06-25T06:17:28.000' AS DateTime) → '2019-06-25T06:17:28.000'::TIMESTAMP
  // Also handles CAST(... AS DateTime2), CAST(... AS Date), etc.
  s = s.replace(
    /\bCAST\s*\(\s*'([^']*)'\s+AS\s+(?:DateTime2?|SmallDateTime|Date)\s*\)/gi,
    "'$1'::TIMESTAMP"
  );

  // CAST(value AS Decimal/Numeric(...)) → value::NUMERIC(...)
  s = s.replace(
    /\bCAST\s*\(\s*([.\d]+)\s+AS\s+(?:Decimal|Numeric)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*\)/gi,
    "$1"
  );

  // GETDATE() → NOW()
  s = s.replace(/\bGETDATE\s*\(\s*\)/gi, "NOW()");

  // ISNULL(x, y) → COALESCE(x, y)
  s = s.replace(/\bISNULL\s*\(/gi, "COALESCE(");

  // Ensure INSERT has INTO (SQL Server allows INSERT [table] without INTO)
  s = s.replace(/^INSERT\s+(?!INTO\b)/i, "INSERT INTO ");

  return s;
}

// ---------------------------------------------------------------------------
// Balanced-paren removal helper
// ---------------------------------------------------------------------------

/**
 * Find all occurrences of a pattern that ends with an opening paren,
 * then remove everything from the pattern start through the matching
 * closing paren (handling nested parens).
 *
 * Used to strip INCLUDE(...), WITH(PAD_INDEX=..., ...) etc.
 */
function replaceBalancedParen(sql: string, pattern: RegExp): string {
  let result = "";
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  // Reset the regex
  pattern.lastIndex = 0;

  while ((match = pattern.exec(sql)) !== null) {
    result += sql.slice(lastIdx, match.index);
    // Start after the opening paren that's part of the pattern
    let depth = 1;
    let j = match.index + match[0].length;
    while (j < sql.length && depth > 0) {
      if (sql[j] === "(") depth++;
      else if (sql[j] === ")") depth--;
      j++;
    }
    lastIdx = j;
  }

  result += sql.slice(lastIdx);
  return result;
}
