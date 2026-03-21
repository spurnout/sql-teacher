export interface SqlDocSection {
  readonly id: string;
  readonly title: string;
  readonly content: string; // markdown with SQL code blocks
  readonly tags: readonly string[]; // matched against exercise.tags for "relevant" grouping
}

export const SQL_DOCS: readonly SqlDocSection[] = [
  {
    id: "select",
    title: "SELECT",
    tags: ["select", "basics", "fundamentals", "column-selection", "select-star"],
    content: `## SELECT Syntax

\`\`\`sql
-- All columns
SELECT * FROM table_name;

-- Specific columns
SELECT column1, column2 FROM table_name;

-- With alias
SELECT column1 AS alias1, column2 AS alias2 FROM table_name;
\`\`\`

**Notes:**
- Use \`SELECT *\` to retrieve all columns (convenient but slower for large tables)
- Use column aliases (\`AS\`) to rename output columns
- Column expressions like \`price_cents / 100.0\` are also valid`,
  },
  {
    id: "where",
    title: "WHERE",
    tags: ["where", "filtering", "filter", "conditions", "comparison-ops", "comparison"],
    content: `## WHERE Clause

\`\`\`sql
SELECT * FROM users
WHERE plan = 'pro';

-- Multiple conditions
WHERE plan = 'pro' AND country = 'US';
WHERE plan = 'pro' OR plan = 'enterprise';
WHERE NOT churned_at IS NULL;
\`\`\`

**Comparison operators:** \`=\`, \`!=\`, \`<>\`, \`>\`, \`<\`, \`>=\`, \`<=\`

**Pattern matching:** \`LIKE 'Jo%'\` (% = any chars, _ = one char)

**NULL checks:** \`IS NULL\`, \`IS NOT NULL\` (never use \`= NULL\`)

**List membership:** \`plan IN ('pro', 'enterprise')\`

**Range:** \`price_cents BETWEEN 1000 AND 5000\``,
  },
  {
    id: "order-by",
    title: "ORDER BY",
    tags: ["order-by", "sorting", "order", "limit", "order-limit"],
    content: `## ORDER BY and LIMIT

\`\`\`sql
-- Sort ascending (default)
SELECT * FROM users ORDER BY created_at;

-- Sort descending
SELECT * FROM users ORDER BY created_at DESC;

-- Multiple columns
SELECT * FROM users ORDER BY country ASC, name DESC;

-- With LIMIT
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Pagination
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;
\`\`\`

**Notes:**
- \`ASC\` = ascending (A→Z, 0→9) — this is the default
- \`DESC\` = descending (Z→A, 9→0)
- NULLs sort last in ASC, first in DESC (PostgreSQL default)`,
  },
  {
    id: "aggregate-functions",
    title: "Aggregate Functions",
    tags: ["aggregations", "aggregate", "count", "sum", "avg", "min", "max", "aggregations"],
    content: `## Aggregate Functions

\`\`\`sql
SELECT
  COUNT(*)          AS total_rows,
  COUNT(column)     AS non_null_count,
  COUNT(DISTINCT x) AS unique_values,
  SUM(amount)       AS total,
  AVG(amount)       AS average,
  MIN(created_at)   AS earliest,
  MAX(created_at)   AS latest
FROM orders;
\`\`\`

**Key rules:**
- \`COUNT(*)\` counts all rows; \`COUNT(col)\` skips NULLs
- Aggregate functions collapse many rows into one result
- You cannot mix non-aggregated columns with aggregates without \`GROUP BY\``,
  },
  {
    id: "group-by",
    title: "GROUP BY",
    tags: ["group-by", "grouping", "group"],
    content: `## GROUP BY

\`\`\`sql
SELECT plan, COUNT(*) AS user_count
FROM users
GROUP BY plan;

-- Multiple group columns
SELECT country, plan, COUNT(*) AS count
FROM users
GROUP BY country, plan
ORDER BY country, count DESC;
\`\`\`

**Rules:**
- Every column in \`SELECT\` must either be in \`GROUP BY\` or inside an aggregate function
- \`GROUP BY\` creates one output row per unique combination of grouped columns`,
  },
  {
    id: "having",
    title: "HAVING",
    tags: ["having", "group-by", "filter-groups"],
    content: `## HAVING

\`\`\`sql
-- Filter groups (not rows) — use HAVING, not WHERE
SELECT plan, COUNT(*) AS user_count
FROM users
GROUP BY plan
HAVING COUNT(*) > 10;
\`\`\`

**WHERE vs HAVING:**
- \`WHERE\` filters **rows** before grouping
- \`HAVING\` filters **groups** after aggregation
- You can use aggregate functions in \`HAVING\` but not in \`WHERE\``,
  },
  {
    id: "inner-join",
    title: "INNER JOIN",
    tags: ["join", "inner-join", "joins", "inner"],
    content: `## INNER JOIN

\`\`\`sql
SELECT u.name, o.id AS order_id, o.total_cents
FROM users u
INNER JOIN orders o ON o.user_id = u.id;
\`\`\`

**What it does:** Returns only rows where the join condition matches in **both** tables.
Rows with no match are excluded from results.

**Aliases:** Use table aliases (e.g., \`u\`, \`o\`) to write shorter column references.

**Multiple joins:**
\`\`\`sql
SELECT u.name, o.id, p.name AS product
FROM orders o
INNER JOIN users u ON u.id = o.user_id
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN products p ON p.id = oi.product_id;
\`\`\``,
  },
  {
    id: "left-join",
    title: "LEFT JOIN",
    tags: ["left-join", "joins", "outer-join", "is-null", "anti-join"],
    content: `## LEFT JOIN

\`\`\`sql
-- Keep all users, even those with no orders
SELECT u.name, o.id AS order_id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
\`\`\`

**What it does:** Returns all rows from the **left** table, plus matched rows from the right.
Unmatched right-side columns are NULL.

**Anti-join pattern** (find users with NO orders):
\`\`\`sql
SELECT u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
\`\`\``,
  },
  {
    id: "subqueries",
    title: "Subqueries",
    tags: ["subquery", "subqueries", "scalar-subquery", "derived-table", "correlated"],
    content: `## Subqueries

**Scalar subquery** (returns one value):
\`\`\`sql
SELECT name,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;
\`\`\`

**Derived table** (subquery in FROM):
\`\`\`sql
SELECT * FROM (
  SELECT user_id, SUM(total_cents) AS total
  FROM orders
  GROUP BY user_id
) AS user_totals
WHERE total > 50000;
\`\`\`

**IN / EXISTS:**
\`\`\`sql
-- IN
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- EXISTS (often faster)
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
\`\`\``,
  },
  {
    id: "ctes",
    title: "CTEs (WITH)",
    tags: ["cte", "ctes", "with", "common-table-expression", "recursive-cte"],
    content: `## CTEs (Common Table Expressions)

\`\`\`sql
WITH order_totals AS (
  SELECT user_id, SUM(total_cents) AS total
  FROM orders
  GROUP BY user_id
),
top_users AS (
  SELECT u.name, ot.total
  FROM users u
  JOIN order_totals ot ON ot.user_id = u.id
  WHERE ot.total > 100000
)
SELECT * FROM top_users ORDER BY total DESC;
\`\`\`

**Benefits:** More readable than nested subqueries. Each CTE is defined once and can be referenced multiple times.

**Recursive CTE:**
\`\`\`sql
WITH RECURSIVE date_series AS (
  SELECT '2024-01-01'::date AS dt
  UNION ALL
  SELECT dt + 1 FROM date_series WHERE dt < '2024-01-31'
)
SELECT dt FROM date_series;
\`\`\``,
  },
  {
    id: "window-functions",
    title: "Window Functions",
    tags: ["window-functions", "window", "over", "partition-by", "row-number", "rank", "dense-rank", "lag", "lead", "running-total", "frame"],
    content: `## Window Functions

\`\`\`sql
-- Basic OVER clause
SELECT name, total_cents,
  SUM(total_cents) OVER () AS grand_total,
  RANK() OVER (ORDER BY total_cents DESC) AS rank
FROM orders;

-- PARTITION BY (like GROUP BY but keeps all rows)
SELECT user_id, country,
  RANK() OVER (PARTITION BY country ORDER BY total_cents DESC) AS rank_in_country
FROM orders o JOIN users u ON u.id = o.user_id;
\`\`\`

**Common functions:**
| Function | Description |
|----------|-------------|
| \`ROW_NUMBER()\` | Unique row number per partition |
| \`RANK()\` | Rank with gaps on ties |
| \`DENSE_RANK()\` | Rank without gaps |
| \`LAG(col, n)\` | Value n rows before current row |
| \`LEAD(col, n)\` | Value n rows after current row |
| \`SUM(col) OVER (...)\` | Running total |

**Frame clause:**
\`\`\`sql
SUM(revenue) OVER (
  ORDER BY month
  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
) AS rolling_3mo
\`\`\``,
  },
  {
    id: "explain-analyze",
    title: "EXPLAIN ANALYZE",
    tags: ["explain", "explain-analyze", "optimization", "query-plan", "index"],
    content: `## EXPLAIN ANALYZE

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42;
\`\`\`

**Key terms:**
| Term | Meaning |
|------|---------|
| **Seq Scan** | Full table scan — reads every row |
| **Index Scan** | Uses an index — much faster for selective queries |
| **Index Only Scan** | All data comes from the index (fastest) |
| **Hash Join** | Builds a hash table for the join |
| **Nested Loop** | Iterates over each row from one side |
| **cost=X..Y** | Estimated startup..total cost |
| **actual time=X..Y** | Real execution time in ms |
| **rows=N** | Estimated vs actual row count |

**When to create an index:**
\`\`\`sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
\`\`\`
Good candidates: columns used in WHERE, JOIN ON, ORDER BY with high selectivity.`,
  },
  {
    id: "null-handling",
    title: "NULL Handling",
    tags: ["null", "is-null", "coalesce", "nullif"],
    content: `## NULL Handling

\`\`\`sql
-- Check for NULL
SELECT * FROM users WHERE churned_at IS NULL;
SELECT * FROM users WHERE churned_at IS NOT NULL;

-- COALESCE: return first non-NULL value
SELECT name, COALESCE(churned_at, NOW()) AS end_date FROM users;

-- NULLIF: return NULL if two values are equal
SELECT NULLIF(quantity, 0) AS safe_qty FROM order_items;
\`\`\`

**Rules:**
- \`NULL = NULL\` is **false** — always use \`IS NULL\` / \`IS NOT NULL\`
- Any arithmetic with NULL returns NULL: \`5 + NULL = NULL\`
- \`COUNT(*)\` includes NULLs; \`COUNT(column)\` skips them`,
  },
  {
    id: "date-functions",
    title: "Date Functions",
    tags: ["dates", "date", "timestamp", "interval", "date-trunc"],
    content: `## Date Functions

\`\`\`sql
-- Current date/time
SELECT NOW(), CURRENT_DATE, CURRENT_TIMESTAMP;

-- Extract parts
SELECT EXTRACT(YEAR FROM created_at) AS year FROM orders;
SELECT EXTRACT(MONTH FROM created_at) AS month FROM orders;

-- Truncate to period
SELECT DATE_TRUNC('month', created_at) AS month FROM orders;
SELECT DATE_TRUNC('year', created_at) AS year FROM orders;

-- Arithmetic
SELECT created_at + INTERVAL '7 days' AS one_week_later FROM orders;
SELECT NOW() - created_at AS age FROM orders;

-- Format
SELECT TO_CHAR(created_at, 'YYYY-MM') AS month_label FROM orders;
\`\`\``,
  },
  {
    id: "string-functions",
    title: "String Functions",
    tags: ["string", "strings", "concat", "like", "ilike"],
    content: `## String Functions

\`\`\`sql
-- Concatenation
SELECT first_name || ' ' || last_name AS full_name FROM users;
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users;

-- Case
SELECT UPPER(name), LOWER(email) FROM users;

-- Pattern matching
SELECT * FROM users WHERE email LIKE '%@gmail.com';
SELECT * FROM users WHERE name ILIKE 'john%';  -- case-insensitive

-- Length and substring
SELECT LENGTH(name), SUBSTRING(name, 1, 3) FROM users;

-- Trim
SELECT TRIM(name), LTRIM(name), RTRIM(name) FROM users;
\`\`\``,
  },
];

/**
 * Returns the subset of SQL_DOCS sections that are relevant to the given exercise tags.
 * Used to highlight docs in the right sidebar when a user is on a specific exercise.
 */
export function getRelevantDocs(tags: readonly string[]): SqlDocSection[] {
  if (tags.length === 0) return [];
  const tagSet = new Set(tags);
  return SQL_DOCS.filter((doc) => doc.tags.some((t) => tagSet.has(t)));
}
