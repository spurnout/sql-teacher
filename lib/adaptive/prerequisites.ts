/**
 * Static concept prerequisite map for adaptive learning.
 *
 * Defines which concepts must be mastered before others. Derived from the
 * pedagogical structure of the 9-phase curriculum. Updated manually when
 * exercises are added or reorganised.
 *
 * Keys are concept names (matching exercise.concept). Values are arrays of
 * prerequisite concept names that should be mastered first.
 */

/** Map from concept → its prerequisite concepts (must be strong before tackling) */
export const CONCEPT_PREREQUISITES: Readonly<Record<string, readonly string[]>> = {
  // Phase 0 — Fundamentals chain
  "Column Selection": ["SELECT *"],
  "WHERE Clause": ["SELECT *"],
  "Comparison & Logic Operators": ["WHERE Clause"],
  "ORDER BY & LIMIT": ["SELECT *"],
  "Aggregate Functions": ["SELECT *"],
  "GROUP BY": ["Aggregate Functions"],
  "HAVING": ["GROUP BY", "WHERE Clause"],
  "WHERE vs HAVING": ["WHERE Clause", "HAVING"],
  "NULL Handling": ["WHERE Clause"],

  // Phase 1 — Joins chain
  "INNER JOIN": ["WHERE Clause", "Column Selection"],
  "INNER JOIN + GROUP BY": ["INNER JOIN", "GROUP BY"],
  "LEFT JOIN + IS NULL": ["INNER JOIN"],
  "Self JOIN": ["INNER JOIN"],
  "Multiple JOINs": ["INNER JOIN"],
  "FULL OUTER JOIN": ["INNER JOIN", "LEFT JOIN + IS NULL"],
  "CROSS JOIN": ["INNER JOIN"],
  "Non-Equi JOIN": ["INNER JOIN", "Comparison & Logic Operators"],
  "JOIN Types": ["INNER JOIN", "LEFT JOIN + IS NULL"],

  // Phase 2 — Subqueries chain
  "Scalar Subquery": ["INNER JOIN", "Aggregate Functions"],
  "Derived Table": ["Scalar Subquery", "GROUP BY"],
  "Correlated Subquery": ["Scalar Subquery"],
  "EXISTS / NOT EXISTS": ["Correlated Subquery"],
  "IN vs JOIN": ["INNER JOIN", "Scalar Subquery"],
  "ANY / ALL": ["Scalar Subquery", "Comparison & Logic Operators"],
  "LATERAL Subquery": ["Correlated Subquery", "ORDER BY & LIMIT"],
  "NOT IN vs NOT EXISTS": ["EXISTS / NOT EXISTS", "NULL Handling"],
  "Subqueries": ["Scalar Subquery", "Correlated Subquery"],
  "EXISTS": ["EXISTS / NOT EXISTS"],

  // Phase 3 — CTEs chain
  "Basic WITH": ["Scalar Subquery", "GROUP BY"],
  "Multiple CTEs": ["Basic WITH"],
  "CTE vs Subquery": ["Basic WITH", "Scalar Subquery"],
  "Recursive CTE": ["Basic WITH"],
  "Recursive CTE + LEFT JOIN": ["Recursive CTE", "LEFT JOIN + IS NULL"],
  "CTE + ROW_NUMBER": ["Basic WITH"],
  "Multiple Chained CTEs": ["Multiple CTEs"],
  "CTE Aggregation Reuse": ["Multiple CTEs", "Aggregate Functions"],
  "CTEs": ["Basic WITH"],

  // Phase 4 — Window Functions chain
  "ROW_NUMBER()": ["GROUP BY", "ORDER BY & LIMIT"],
  "RANK, DENSE_RANK": ["ROW_NUMBER()"],
  "PARTITION BY": ["ROW_NUMBER()"],
  "LAG / LEAD": ["ROW_NUMBER()"],
  "Running Total": ["ROW_NUMBER()", "Aggregate Functions"],
  "Frame Clause": ["Running Total"],
  "NTILE": ["ROW_NUMBER()"],
  "FIRST_VALUE / LAST_VALUE": ["Frame Clause"],
  "Named WINDOW": ["Frame Clause", "FIRST_VALUE / LAST_VALUE"],
  "Window Functions": ["ROW_NUMBER()"],
  "RANK vs DENSE_RANK": ["RANK, DENSE_RANK"],

  // Phase 5 — Optimization chain
  "EXPLAIN ANALYZE": ["INNER JOIN", "Aggregate Functions"],
  "Seq Scan vs Index Scan": ["EXPLAIN ANALYZE"],
  "Query Rewriting": ["Correlated Subquery", "INNER JOIN"],
  "Index Selectivity": ["Seq Scan vs Index Scan"],
  "Partial Index": ["Index Selectivity"],
  "CTE Optimization Fence": ["Basic WITH", "EXPLAIN ANALYZE"],
  "Sequential Scan Detection": ["Seq Scan vs Index Scan"],
  "Query Optimization": ["EXPLAIN ANALYZE"],

  // Phase 6 — SQL Patterns (mostly independent; light prerequisites)
  "CASE WHEN": ["WHERE Clause"],
  "CASE in SELECT": ["CASE WHEN", "GROUP BY"],
  "SUM(CASE WHEN ...)": ["CASE WHEN", "Aggregate Functions"],
  "COALESCE, NULLIF": ["NULL Handling"],
  "COALESCE in queries": ["COALESCE, NULLIF"],
  "LIKE / ILIKE": ["WHERE Clause"],
  "String functions": ["Column Selection"],
  "Date/Time functions": ["Column Selection"],
  "Date arithmetic": ["Date/Time functions"],
  "DISTINCT": ["SELECT *"],
  "UNION / UNION ALL": ["SELECT *"],
  "INTERSECT, EXCEPT": ["UNION / UNION ALL"],
  "JSONB operators": ["WHERE Clause"],
  "JSONB analytics": ["JSONB operators", "GROUP BY"],
  "NULL handling": ["NULL Handling"],
  "Set operations": ["UNION / UNION ALL"],
  "JSONB syntax": ["JSONB operators"],

  // Phase 7 — DML & DDL (mostly independent of query skills)
  "CREATE TABLE": ["Data types"],
  "ALTER TABLE": ["CREATE TABLE"],
  "INSERT": ["CREATE TABLE"],
  "UPDATE, DELETE": ["INSERT"],
  "UPSERT": ["INSERT"],
  "Data type selection": ["Data types"],
  "Constraint behavior": ["CREATE TABLE"],
  "DELETE safety": ["UPDATE, DELETE"],
  "INSERT syntax": ["INSERT"],
  "ALTER TABLE implications": ["ALTER TABLE"],

  // Phase 8 — DB Admin chain
  "Index creation": ["Seq Scan vs Index Scan", "CREATE TABLE"],
  "information_schema": ["CREATE TABLE"],
  "pg_stat_user_indexes": ["Index creation"],
  "Views": ["Basic WITH"],
  "Transactions": ["INSERT", "UPDATE, DELETE"],
  "Isolation levels": ["Transactions"],
  "Table maintenance": ["Transactions"],
  "pg_stat_activity": ["Transactions"],
  "Access control": ["CREATE TABLE"],
  "Index selection": ["Index creation"],
  "Isolation problems": ["Isolation levels"],
  "DBA troubleshooting": ["pg_stat_activity"],
};

/**
 * Get all concepts that should be strong before attempting the given concept.
 * Returns an empty array for concepts with no prerequisites (foundational).
 */
export function getPrerequisites(concept: string): readonly string[] {
  return CONCEPT_PREREQUISITES[concept] ?? [];
}

/**
 * Get all concepts that this concept is a prerequisite for.
 */
export function getDependents(concept: string): readonly string[] {
  return Object.entries(CONCEPT_PREREQUISITES)
    .filter(([, prereqs]) => prereqs.includes(concept))
    .map(([dependent]) => dependent);
}
