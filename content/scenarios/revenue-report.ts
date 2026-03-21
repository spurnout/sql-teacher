import type { ScenarioStep } from "@/lib/scenarios/types";

export const revenueReportSteps: readonly ScenarioStep[] = [
  {
    stepIndex: 0,
    title: "Monthly Revenue Totals",
    description: `Your CEO asks: **"What does our monthly revenue look like?"**

Write a query that shows total revenue per month from **completed orders only**. Display the month (as a date) and total revenue in dollars. Sort chronologically.`,
    expectedSql: `SELECT
  DATE_TRUNC('month', created_at)::date AS month,
  SUM(total_cents) / 100.0 AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month`,
    hints: [
      { level: 1, text: "Use DATE_TRUNC('month', created_at) to group by month." },
      { level: 2, text: "SUM(total_cents) / 100.0 gives revenue in dollars. Don't forget to filter for completed orders." },
      { level: 3, text: "SELECT DATE_TRUNC('month', created_at)::date AS month, SUM(total_cents) / 100.0 AS revenue FROM orders WHERE status = 'completed' GROUP BY ... ORDER BY month" },
    ],
    explanation: "DATE_TRUNC truncates timestamps to the month boundary, and SUM aggregates the order totals within each month.",
    tags: ["date-trunc", "aggregate", "revenue"],
    difficulty: "intermediate",
  },
  {
    stepIndex: 1,
    title: "Month-over-Month Growth",
    description: `Great — the CEO can see the monthly numbers. Now they ask: **"How much are we growing each month?"**

Using the monthly revenue data, add a column showing the **growth amount** compared to the previous month. The first month should show \`0\` for growth (no prior month).`,
    contextFromPreviousStep: "You now have monthly revenue totals. Build on that to add growth calculations.",
    expectedSql: `SELECT
  month,
  revenue,
  revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month) AS growth
FROM (
  SELECT
    DATE_TRUNC('month', created_at)::date AS month,
    SUM(total_cents) / 100.0 AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
) AS monthly
ORDER BY month`,
    hints: [
      { level: 1, text: "The LAG window function retrieves a value from a previous row." },
      { level: 2, text: "LAG(revenue, 1, revenue) OVER (ORDER BY month) returns the previous month's revenue, defaulting to the current revenue for the first row." },
      { level: 3, text: "Wrap your monthly revenue query as a subquery, then use LAG in the outer SELECT: revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month) AS growth" },
    ],
    explanation: "LAG with a default value of the current revenue ensures the first month shows 0 growth. The subquery provides the aggregated base data.",
    tags: ["lag", "window-function", "growth"],
    difficulty: "intermediate",
  },
  {
    stepIndex: 2,
    title: "Best Product Per Month",
    description: `The CEO is impressed. Final ask: **"Which product generated the most revenue each month?"**

Show the month, the top product name, and its revenue. Only include completed orders. If there's a tie, pick either one.`,
    contextFromPreviousStep: "You've built monthly revenue and growth trends. Now drill into which products drive each month's numbers.",
    expectedSql: `SELECT month, product_name, product_revenue
FROM (
  SELECT
    DATE_TRUNC('month', o.created_at)::date AS month,
    p.name AS product_name,
    SUM(oi.unit_price_cents * oi.quantity) / 100.0 AS product_revenue,
    ROW_NUMBER() OVER (
      PARTITION BY DATE_TRUNC('month', o.created_at)
      ORDER BY SUM(oi.unit_price_cents * oi.quantity) DESC
    ) AS rn
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'completed'
  GROUP BY DATE_TRUNC('month', o.created_at), p.name
) AS ranked
WHERE rn = 1
ORDER BY month`,
    hints: [
      { level: 1, text: "You'll need to compute revenue per product per month, then pick the top one per month." },
      { level: 2, text: "Use ROW_NUMBER() with PARTITION BY month and ORDER BY revenue DESC to rank products within each month." },
      { level: 3, text: "Build a subquery that groups by month + product, adds ROW_NUMBER() OVER (PARTITION BY month ORDER BY SUM(...) DESC), then filter WHERE rn = 1 in the outer query." },
    ],
    explanation: "ROW_NUMBER partitioned by month picks exactly one top product per month. The 3-table join (order_items → orders → products) connects items to both the order date and the product name.",
    tags: ["row-number", "partition-by", "join", "revenue"],
    difficulty: "advanced",
  },
  {
    stepIndex: 3,
    title: "Executive Summary",
    description: `The CEO loved the analysis! For the final slide, they want a single query showing an **executive summary**: each month with its total revenue, growth from the previous month, and the name of the top-selling product.

Combine everything into one clean result set.`,
    contextFromPreviousStep: "You've built all the individual pieces — monthly revenue, growth, and top product. Now combine them into a single executive view.",
    expectedSql: `WITH monthly AS (
  SELECT
    DATE_TRUNC('month', created_at)::date AS month,
    SUM(total_cents) / 100.0 AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
),
with_growth AS (
  SELECT
    month,
    revenue,
    revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month) AS growth
  FROM monthly
),
top_products AS (
  SELECT month, product_name
  FROM (
    SELECT
      DATE_TRUNC('month', o.created_at)::date AS month,
      p.name AS product_name,
      ROW_NUMBER() OVER (
        PARTITION BY DATE_TRUNC('month', o.created_at)
        ORDER BY SUM(oi.unit_price_cents * oi.quantity) DESC
      ) AS rn
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status = 'completed'
    GROUP BY DATE_TRUNC('month', o.created_at), p.name
  ) AS ranked
  WHERE rn = 1
)
SELECT wg.month, wg.revenue, wg.growth, tp.product_name AS top_product
FROM with_growth wg
JOIN top_products tp ON tp.month = wg.month
ORDER BY wg.month`,
    hints: [
      { level: 1, text: "Use CTEs to organize each piece: one for monthly revenue, one for growth, one for top product." },
      { level: 2, text: "Create 3 CTEs: monthly (revenue), with_growth (adds LAG), top_products (ROW_NUMBER). Then JOIN with_growth and top_products on month." },
      { level: 3, text: "WITH monthly AS (...), with_growth AS (SELECT ..., LAG(...) FROM monthly), top_products AS (...WHERE rn=1) SELECT wg.*, tp.product_name FROM with_growth wg JOIN top_products tp ON tp.month = wg.month" },
    ],
    explanation: "CTEs let you build complex reports step-by-step. Each CTE handles one concern (aggregation, growth, ranking), and the final SELECT joins them together cleanly.",
    tags: ["cte", "lag", "row-number", "executive-report"],
    difficulty: "advanced",
  },
];
