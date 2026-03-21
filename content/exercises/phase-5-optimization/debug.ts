import type { Exercise } from "@/lib/exercises/types";

export const phase5DebugExercises: readonly Exercise[] = [
  {
    id: "p5-debug-missing-distinct",
    phase: "phase-5",
    order: 10,
    title: "Bug Fix: Missing DISTINCT Causes Duplicates",
    concept: "DISTINCT",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should list the **unique product categories** that appear in completed orders. But it returns duplicate category names — one per order item instead of one per category.

**Expected:** Each category should appear exactly once.

**Run the buggy query**, count the duplicate rows, and **fix** the query.`,
    starterSql: `SELECT p.category
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
ORDER BY p.category;`,
    expectedSql: `SELECT DISTINCT p.category
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
ORDER BY p.category`,
    explanation:
      "Without DISTINCT, the query returns one row per order item — if 30 order items are in the 'analytics' category, you get 30 rows saying 'analytics'. DISTINCT collapses duplicates so each category appears once.",
    bugDescription:
      "The query lacked `DISTINCT` in the SELECT clause. Since multiple order items can have the same product category, the JOIN produces duplicate category rows. Adding `SELECT DISTINCT` eliminates the duplicates.",
    hints: [
      { level: 1, text: "How many rows do you get? Are there repeated values? What keyword removes duplicates?" },
      { level: 2, text: "The `DISTINCT` keyword eliminates duplicate rows. Where should it go in the SELECT?" },
      { level: 3, text: "Change `SELECT p.category` to `SELECT DISTINCT p.category`." },
    ],
    tags: ["distinct", "optimization", "debug"],
  },
  {
    id: "p5-debug-where-vs-having",
    phase: "phase-5",
    order: 11,
    title: "Bug Fix: Aggregate in WHERE Instead of HAVING",
    concept: "WHERE vs HAVING",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should find users whose **average order value** exceeds $50. But it uses WHERE instead of HAVING to filter on the aggregate, causing a SQL error.

**Expected:** Users with an average completed order value above $50.

**Run the buggy query**, read the error about aggregates in WHERE, and **fix** it.`,
    starterSql: `SELECT u.name, AVG(o.total_cents) / 100.0 AS avg_order_value
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
  AND AVG(o.total_cents) / 100.0 > 50
GROUP BY u.id, u.name
ORDER BY avg_order_value DESC;`,
    expectedSql: `SELECT u.name, AVG(o.total_cents) / 100.0 AS avg_order_value
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
HAVING AVG(o.total_cents) / 100.0 > 50
ORDER BY avg_order_value DESC`,
    explanation:
      "WHERE filters individual rows before aggregation — you can't use aggregate functions like AVG() in a WHERE clause. HAVING filters groups after aggregation, which is where aggregate conditions belong.",
    bugDescription:
      "The query placed an aggregate condition (`AVG(o.total_cents) / 100.0 > 50`) in the WHERE clause. Aggregates can only be used in HAVING (which filters after GROUP BY). The non-aggregate filter (`status = 'completed'`) stays in WHERE; the aggregate filter moves to HAVING.",
    hints: [
      { level: 1, text: "Can you use aggregate functions like AVG() in a WHERE clause? Where do aggregate filters go?" },
      { level: 2, text: "Move the `AVG(...)` condition from WHERE to a HAVING clause after GROUP BY." },
      { level: 3, text: "Remove `AND AVG(o.total_cents) / 100.0 > 50` from WHERE. Add `HAVING AVG(o.total_cents) / 100.0 > 50` after GROUP BY." },
    ],
    tags: ["having", "where", "aggregate", "debug"],
  },
  {
    id: "p5-debug-count-null",
    phase: "phase-5",
    order: 12,
    title: "Bug Fix: COUNT(*) vs COUNT(column)",
    concept: "COUNT and NULLs",
    mode: "debug",
    difficulty: "advanced",
    description: `## Debug & Fix

This query tries to find the **number of churned users per country**. But it counts ALL users per country instead of only those who have churned (have a non-NULL \`churned_at\`).

**Expected:** Count only users where \`churned_at IS NOT NULL\` for each country.

**Run the buggy query**, notice the counts are too high (including non-churned users), and **fix** it.`,
    starterSql: `SELECT country, COUNT(*) AS churned_count
FROM users
GROUP BY country
ORDER BY churned_count DESC;`,
    expectedSql: `SELECT country, COUNT(churned_at) AS churned_count
FROM users
GROUP BY country
ORDER BY churned_count DESC`,
    explanation:
      "COUNT(*) counts all rows regardless of NULL values. COUNT(churned_at) only counts rows where churned_at is NOT NULL — i.e., only churned users. This is a subtle but critical difference.",
    bugDescription:
      "The query used `COUNT(*)` which counts every user per country, not just churned ones. `COUNT(churned_at)` skips NULLs, so it only counts users who actually churned (have a non-NULL `churned_at` value).",
    hints: [
      { level: 1, text: "Does COUNT(*) distinguish between churned and non-churned users? How does COUNT handle NULLs?" },
      { level: 2, text: "COUNT(*) counts all rows. COUNT(column) skips NULLs. Which column indicates a user has churned?" },
      { level: 3, text: "Change `COUNT(*)` to `COUNT(churned_at)` — this only counts rows where `churned_at` is not NULL." },
    ],
    tags: ["count", "null", "aggregate", "debug"],
  },
];
