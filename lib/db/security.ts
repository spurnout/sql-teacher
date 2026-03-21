const BLOCKED_PATTERNS: RegExp[] = [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bCOPY\b/i,
  /\bpg_read_file\b/i,
  /\bpg_ls_dir\b/i,
  /\blo_import\b/i,
  /\blo_export\b/i,
  /\bpg_sleep\b/i,
  /;\s*\S/,
];

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export function validateQuery(sql: string): ValidationResult {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { valid: false, reason: "Query cannot be empty." };
  }

  if (trimmed.length > 10_000) {
    return { valid: false, reason: "Query exceeds maximum length (10,000 characters)." };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason: "Only SELECT queries and CTEs (WITH) are allowed.",
      };
    }
  }

  if (!/^\s*(WITH|SELECT|EXPLAIN)\b/i.test(trimmed)) {
    return {
      valid: false,
      reason: "Only SELECT queries, CTEs (WITH), and EXPLAIN are allowed.",
    };
  }

  return { valid: true };
}

export function wrapWithLimit(sql: string, limit = 500): string {
  const trimmed = sql.trim().replace(/;+\s*$/, "");

  if (/^\s*EXPLAIN\b/i.test(trimmed)) {
    return trimmed;
  }

  return `SELECT * FROM (${trimmed}) AS __student_query LIMIT ${limit}`;
}
