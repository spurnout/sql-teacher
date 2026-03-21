import type { Exercise } from "@/lib/exercises/types";

export const salesDashboardExercises: readonly Exercise[] = [
  {
    id: "cap-sales-monthly-revenue",
    phase: "capstone",
    order: 1,
    title: "Monthly Revenue Trend",
    concept: "Revenue by month",
    mode: "open",
    difficulty: "intermediate",
    description: `## Dashboard Widget: Monthly Revenue

Write a query that shows revenue per month. Display:
- \`month\` — the first day of each month (use DATE_TRUNC)
- \`revenue_cents\` — total order revenue for that month (SUM of total_cents)
- \`order_count\` — number of orders

Only include orders with status = 'completed'. Order by month ascending.`,
    expectedSql: `SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_cents) AS revenue_cents, COUNT(*) AS order_count FROM orders WHERE status = 'completed' GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`,
    explanation: "DATE_TRUNC + SUM + GROUP BY is the standard time-series aggregation pattern.",
    hints: [],
    tags: ["date-trunc", "aggregate", "revenue"],
  },
  {
    id: "cap-sales-top-products",
    phase: "capstone",
    order: 2,
    title: "Top 5 Products by Revenue",
    concept: "Product ranking",
    mode: "open",
    difficulty: "intermediate",
    description: `## Dashboard Widget: Top Products

Find the top 5 products by total revenue. Display:
- \`product_name\` — from the products table
- \`total_revenue_cents\` — SUM of (quantity * unit_price_cents) from order_items
- \`units_sold\` — SUM of quantity

Join order_items with products. Order by total_revenue_cents descending. Limit to 5.`,
    expectedSql: `SELECT p.name AS product_name, SUM(oi.quantity * oi.unit_price_cents) AS total_revenue_cents, SUM(oi.quantity) AS units_sold FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_revenue_cents DESC LIMIT 5`,
    explanation: "JOIN + GROUP BY + ORDER BY LIMIT is the classic top-N pattern for product analytics.",
    hints: [],
    tags: ["join", "aggregate", "top-n", "product"],
  },
  {
    id: "cap-sales-acquisition",
    phase: "capstone",
    order: 3,
    title: "Customer Acquisition by Country",
    concept: "Geographic analysis",
    mode: "open",
    difficulty: "beginner",
    description: `## Dashboard Widget: Users by Country

Show how many users signed up from each country. Display:
- \`country\`
- \`user_count\` — COUNT of users
- \`pct_of_total\` — percentage of total users, rounded to 1 decimal (use \`ROUND(... * 100.0 / (SELECT COUNT(*) FROM users), 1)\`)

Order by user_count descending.`,
    expectedSql: `SELECT country, COUNT(*) AS user_count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 1) AS pct_of_total FROM users GROUP BY country ORDER BY user_count DESC`,
    explanation: "Scalar subquery in SELECT for percentage calculation is a standard reporting pattern.",
    hints: [],
    tags: ["group-by", "subquery", "percentage"],
  },
  {
    id: "cap-sales-category-revenue",
    phase: "capstone",
    order: 4,
    title: "Revenue by Category Over Time",
    concept: "Pivot by category",
    mode: "open",
    difficulty: "advanced",
    description: `## Dashboard Widget: Category Revenue Trend

Create a monthly revenue breakdown by product category using the CASE WHEN pivot pattern.

Show:
- \`month\` — DATE_TRUNC('month', o.created_at)
- \`electronics_cents\` — revenue from products where category = 'electronics'
- \`software_cents\` — revenue from products where category = 'software'
- \`other_cents\` — revenue from all other categories

Use a CTE to join orders → order_items → products, then pivot with SUM(CASE WHEN ...).
Order by month ascending.`,
    expectedSql: `WITH order_details AS (SELECT o.created_at, p.category, oi.quantity * oi.unit_price_cents AS line_total FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.status = 'completed') SELECT DATE_TRUNC('month', created_at) AS month, SUM(CASE WHEN category = 'electronics' THEN line_total ELSE 0 END) AS electronics_cents, SUM(CASE WHEN category = 'software' THEN line_total ELSE 0 END) AS software_cents, SUM(CASE WHEN category NOT IN ('electronics', 'software') THEN line_total ELSE 0 END) AS other_cents FROM order_details GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`,
    explanation: "CTE + CASE WHEN pivot is one of the most powerful patterns for building dashboard queries. This combines skills from multiple phases.",
    hints: [],
    tags: ["cte", "case-when", "pivot", "join", "aggregate"],
  },
  {
    id: "cap-sales-conversion",
    phase: "capstone",
    order: 5,
    title: "Order Conversion Funnel",
    concept: "Funnel analysis",
    mode: "open",
    difficulty: "advanced",
    description: `## Dashboard Widget: Conversion Funnel

Build a conversion funnel showing:
- \`total_users\` — total number of users
- \`users_with_orders\` — users who placed at least one order
- \`users_with_completed_orders\` — users who have at least one completed order
- \`conversion_rate_pct\` — users_with_completed_orders as a percentage of total_users (ROUND to 1 decimal)

All in a single row.`,
    expectedSql: `SELECT COUNT(*) AS total_users, COUNT(DISTINCT o.user_id) FILTER (WHERE o.id IS NOT NULL) AS users_with_orders, COUNT(DISTINCT o.user_id) FILTER (WHERE o.status = 'completed') AS users_with_completed_orders, ROUND(COUNT(DISTINCT o.user_id) FILTER (WHERE o.status = 'completed') * 100.0 / COUNT(*), 1) AS conversion_rate_pct FROM users u LEFT JOIN orders o ON o.user_id = u.id`,
    explanation: "FILTER clause with COUNT(DISTINCT) and LEFT JOIN is an elegant funnel analysis pattern. The LEFT JOIN ensures all users are counted even if they have no orders.",
    hints: [],
    tags: ["left-join", "filter", "distinct", "funnel", "analytics"],
  },
];
