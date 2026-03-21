import type { Exercise } from "@/lib/exercises/types";

export const phase3DebugExercises: readonly Exercise[] = [
  {
    id: "p3-debug-cte-wrong-reference",
    phase: "phase-3",
    order: 11,
    title: "Bug Fix: CTE References Wrong Table",
    concept: "CTE Basics",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query uses a CTE to compute each user's total spending, then filters to high spenders. But the final SELECT reads from the original \`orders\` table instead of the CTE, ignoring the aggregation.

**Expected:** Users who have spent more than $200 total (across completed orders).

**Run the buggy query**, notice it shows raw orders instead of aggregated results, and **fix** the FROM clause.`,
    starterSql: `WITH user_spending AS (
  SELECT u.id, u.name, SUM(o.total_cents) / 100.0 AS total_spent
  FROM users u
  JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name
)
SELECT name, total_spent
FROM orders
WHERE total_spent > 200
ORDER BY total_spent DESC;`,
    expectedSql: `WITH user_spending AS (
  SELECT u.id, u.name, SUM(o.total_cents) / 100.0 AS total_spent
  FROM users u
  JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name
)
SELECT name, total_spent
FROM user_spending
WHERE total_spent > 200
ORDER BY total_spent DESC`,
    explanation:
      "The CTE `user_spending` computes the aggregated data, but the final SELECT was reading from `orders` — the raw table — instead of `user_spending`. CTEs are only useful if you reference them in the main query.",
    bugDescription:
      "The main query's FROM clause referenced `orders` instead of the CTE `user_spending`. The CTE was computed but never used. Changing `FROM orders` to `FROM user_spending` makes the query use the pre-aggregated results.",
    hints: [
      { level: 1, text: "Where does the main SELECT get its data from? Is it using the CTE?" },
      { level: 2, text: "The FROM clause says `orders` but should reference the CTE name `user_spending`." },
      { level: 3, text: "Change `FROM orders` to `FROM user_spending` in the main SELECT." },
    ],
    tags: ["cte", "with", "debug"],
  },
  {
    id: "p3-debug-cte-column-mismatch",
    phase: "phase-3",
    order: 12,
    title: "Bug Fix: CTE Column Mismatch",
    concept: "CTE Structure",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query uses two CTEs — one for revenue by category, and one for order counts by category — then joins them. But the join condition uses the wrong column name, causing categories to not match.

**Expected:** Each product category with its total revenue and order count.

**Run the buggy query**, notice the NULL values or missing rows, and **fix** the join condition.`,
    starterSql: `WITH category_revenue AS (
  SELECT p.category, SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.category
),
category_orders AS (
  SELECT p.category AS cat, COUNT(DISTINCT oi.order_id) AS order_count
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.category
)
SELECT cr.category, cr.revenue, co.order_count
FROM category_revenue cr
JOIN category_orders co ON co.category = cr.category
ORDER BY cr.revenue DESC;`,
    expectedSql: `WITH category_revenue AS (
  SELECT p.category, SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS revenue
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.category
),
category_orders AS (
  SELECT p.category AS cat, COUNT(DISTINCT oi.order_id) AS order_count
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.category
)
SELECT cr.category, cr.revenue, co.order_count
FROM category_revenue cr
JOIN category_orders co ON co.cat = cr.category
ORDER BY cr.revenue DESC`,
    explanation:
      "The second CTE aliases its category column as `cat`, but the JOIN condition referenced `co.category` which doesn't exist. Using the correct alias `co.cat` fixes the join.",
    bugDescription:
      "The column alias mismatch: `category_orders` uses `AS cat` for the category column, but the JOIN condition referenced `co.category`. Since the column was aliased to `cat`, the correct reference is `co.cat`.",
    hints: [
      { level: 1, text: "Look at the column names in each CTE. Do they match what the JOIN condition references?" },
      { level: 2, text: "The second CTE aliases category as `cat`. What column name does the ON clause use for `co`?" },
      { level: 3, text: "Change `co.category` to `co.cat` in the JOIN condition." },
    ],
    tags: ["cte", "alias", "join", "debug"],
  },
  {
    id: "p3-debug-cte-filter-placement",
    phase: "phase-3",
    order: 13,
    title: "Bug Fix: Filter in Wrong CTE",
    concept: "CTE Composition",
    mode: "debug",
    difficulty: "advanced",
    description: `## Debug & Fix

This query calculates monthly revenue for completed orders, then finds months with revenue above $500. But the \`completed\` filter is in the wrong CTE — it references \`status\` in a CTE that only has \`month\` and \`revenue\` columns, causing an error.

**Expected:** Monthly revenue from completed orders only, showing months above $500.

**Run the buggy query**, read the error about the missing column, and **move the filter to the correct CTE**.`,
    starterSql: `WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', o.created_at)::date AS month,
    SUM(o.total_cents) / 100.0 AS revenue
  FROM orders o
  GROUP BY DATE_TRUNC('month', o.created_at)
),
high_months AS (
  SELECT month, revenue
  FROM monthly_revenue
  WHERE status = 'completed'
)
SELECT month, revenue
FROM high_months
WHERE revenue > 500
ORDER BY month;`,
    expectedSql: `WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', o.created_at)::date AS month,
    SUM(o.total_cents) / 100.0 AS revenue
  FROM orders o
  WHERE o.status = 'completed'
  GROUP BY DATE_TRUNC('month', o.created_at)
),
high_months AS (
  SELECT month, revenue
  FROM monthly_revenue
)
SELECT month, revenue
FROM high_months
WHERE revenue > 500
ORDER BY month`,
    explanation:
      "The `status = 'completed'` filter was placed in `high_months` (which reads from the aggregated `monthly_revenue` CTE that has no `status` column). It should be in `monthly_revenue` where the raw `orders` table is accessed.",
    bugDescription:
      "The WHERE clause `status = 'completed'` was placed in the `high_months` CTE, which reads from the aggregated `monthly_revenue` — a table with only `month` and `revenue` columns, no `status`. Moving the filter to the `monthly_revenue` CTE (where `orders` is queried) correctly restricts to completed orders.",
    hints: [
      { level: 1, text: "Which CTE has access to the `status` column? Is `status` available in `monthly_revenue`'s output?" },
      { level: 2, text: "The `status` column comes from the `orders` table. The filter should be in the CTE that queries `orders` directly." },
      { level: 3, text: "Move `WHERE status = 'completed'` from `high_months` into `monthly_revenue`, adding it as `WHERE o.status = 'completed'` before the GROUP BY." },
    ],
    tags: ["cte", "where", "filter", "debug"],
  },
];
