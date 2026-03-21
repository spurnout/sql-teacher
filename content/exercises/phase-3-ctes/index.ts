import type { Exercise } from "@/lib/exercises/types";
import { phase3DebugExercises } from "./debug";

const phase3BaseExercises: readonly Exercise[] = [
  {
    id: "p3-basic-cte-worked",
    phase: "phase-3",
    order: 1,
    title: "Your First CTE",
    concept: "Basic WITH",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Monthly Revenue Using a CTE

A **Common Table Expression (CTE)** uses \`WITH\` to name a subquery, making complex queries more readable.

\`\`\`sql
WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    SUM(total_cents) / 100.0 AS revenue_dollars
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT
  month,
  revenue_dollars
FROM monthly_revenue
ORDER BY month;
\`\`\`

The CTE \`monthly_revenue\` is defined once and then referenced like a table. It makes the query easier to read and debug.`,
    starterSql: `WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    SUM(total_cents) / 100.0 AS revenue_dollars
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT
  month,
  revenue_dollars
FROM monthly_revenue
ORDER BY month;`,
    expectedSql: `WITH monthly_revenue AS (
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    SUM(total_cents) / 100.0 AS revenue_dollars
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT
  month,
  revenue_dollars
FROM monthly_revenue
ORDER BY month`,
    explanation:
      "CTEs give names to intermediate result sets. They're equivalent to subqueries in FROM but much easier to read, especially when you chain multiple steps.",
    hints: [],
    tags: ["cte", "with", "aggregation", "date-trunc"],
    skipValidation: true,
  },
  {
    id: "p3-multi-cte",
    phase: "phase-3",
    order: 2,
    title: "MRR by Plan",
    concept: "Multiple CTEs",
    mode: "scaffolded",
    difficulty: "intermediate",
    description: `**Business question:** Calculate the total Monthly Recurring Revenue (MRR) by user plan. Show the plan name, number of active subscriptions, and total MRR in dollars. Sort by MRR descending.

Fill in the blanks to chain two CTEs.`,
    starterSql: `WITH active_subs AS (
  SELECT
    s.user_id,
    s.mrr_cents
  FROM subscriptions s
  WHERE s.status = ____
),
plan_mrr AS (
  SELECT
    u.plan,
    COUNT(*) AS sub_count,
    SUM(a.mrr_cents) / 100.0 AS mrr_dollars
  FROM active_subs a
  INNER JOIN ____ ON ____
  GROUP BY u.plan
)
SELECT * FROM plan_mrr
ORDER BY mrr_dollars DESC;`,
    expectedSql: `WITH active_subs AS (
  SELECT
    s.user_id,
    s.mrr_cents
  FROM subscriptions s
  WHERE s.status = 'active'
),
plan_mrr AS (
  SELECT
    u.plan,
    COUNT(*) AS sub_count,
    SUM(a.mrr_cents) / 100.0 AS mrr_dollars
  FROM active_subs a
  INNER JOIN users u ON u.id = a.user_id
  GROUP BY u.plan
)
SELECT * FROM plan_mrr
ORDER BY mrr_dollars DESC`,
    explanation:
      "Multiple CTEs are separated by commas. Each CTE can reference the ones defined before it. This creates a readable pipeline of data transformations.",
    hints: [
      {
        level: 1,
        text: "The first blank filters for active subscriptions. The second and third blanks join active_subs to users.",
      },
      {
        level: 2,
        text: "First blank: `'active'`. Second blank: `users u`. Third blank: `u.id = a.user_id`.",
      },
      {
        level: 3,
        text: "Complete: `WHERE s.status = 'active'` and `INNER JOIN users u ON u.id = a.user_id`.",
      },
    ],
    tags: ["cte", "multiple-ctes", "mrr", "aggregation"],
  },
  {
    id: "p3-cte-rewrite",
    phase: "phase-3",
    order: 3,
    title: "Rewrite a Nested Subquery",
    concept: "CTE vs Subquery",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Find the top 5 users by total completed order value. Show their name, email, and total spend in dollars.

Here's the nested subquery version:
\`\`\`sql
SELECT * FROM (
  SELECT u.name, u.email, SUM(o.total_cents) / 100.0 AS total_spend
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name, u.email
) AS user_spending
ORDER BY total_spend DESC
LIMIT 5;
\`\`\`

**Rewrite this using a CTE** instead of a nested subquery.`,
    starterSql: `-- Rewrite the nested subquery above as a CTE\n`,
    expectedSql: `WITH user_spending AS (
  SELECT
    u.name,
    u.email,
    SUM(o.total_cents) / 100.0 AS total_spend
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name, u.email
)
SELECT name, email, total_spend
FROM user_spending
ORDER BY total_spend DESC
LIMIT 5`,
    explanation:
      "CTEs and subqueries in FROM are functionally equivalent. CTEs are preferred for readability — the logic reads top-to-bottom instead of inside-out.",
    hints: [
      {
        level: 1,
        text: "Move the inner SELECT into a `WITH user_spending AS (...)` block, then SELECT from it in the main query.",
      },
      {
        level: 2,
        text: "`WITH user_spending AS ( SELECT u.name, u.email, SUM(o.total_cents) / 100.0 AS total_spend FROM users u INNER JOIN orders o ON o.user_id = u.id WHERE o.status = 'completed' GROUP BY u.id, u.name, u.email )`",
      },
      {
        level: 3,
        text: "Then: `SELECT name, email, total_spend FROM user_spending ORDER BY total_spend DESC LIMIT 5`",
      },
    ],
    tags: ["cte", "refactoring", "readability"],
  },
  {
    id: "p3-recursive-worked",
    phase: "phase-3",
    order: 4,
    title: "Generate a Date Series",
    concept: "Recursive CTE",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: Recursive CTE for Date Series

A **recursive CTE** references itself to build results row by row. It needs a base case and a recursive step.

\`\`\`sql
WITH RECURSIVE date_series AS (
  -- Base case: start date
  SELECT DATE '2024-01-01' AS dt

  UNION ALL

  -- Recursive step: add one month until end date
  SELECT (dt + INTERVAL '1 month')::date
  FROM date_series
  WHERE dt < DATE '2024-06-01'
)
SELECT dt AS month_start
FROM date_series
ORDER BY dt;
\`\`\`

This generates one row per month from Jan to Jun 2024. The recursion stops when the WHERE condition becomes false.`,
    starterSql: `WITH RECURSIVE date_series AS (
  SELECT DATE '2024-01-01' AS dt
  UNION ALL
  SELECT (dt + INTERVAL '1 month')::date
  FROM date_series
  WHERE dt < DATE '2024-06-01'
)
SELECT dt AS month_start
FROM date_series
ORDER BY dt;`,
    expectedSql: `WITH RECURSIVE date_series AS (
  SELECT DATE '2024-01-01' AS dt
  UNION ALL
  SELECT (dt + INTERVAL '1 month')::date
  FROM date_series
  WHERE dt < DATE '2024-06-01'
)
SELECT dt AS month_start
FROM date_series
ORDER BY dt`,
    explanation:
      "Recursive CTEs have two parts: a base case (non-recursive term) and a recursive term joined by UNION ALL. The recursion stops when the recursive term returns no rows.",
    hints: [],
    tags: ["cte", "recursive", "date-series"],
    skipValidation: true,
  },
  {
    id: "p3-recursive-open",
    phase: "phase-3",
    order: 5,
    title: "Monthly Signup Counts (No Gaps)",
    concept: "Recursive CTE + LEFT JOIN",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Show the number of user signups per month from January 2023 to June 2024, including months with zero signups. Return month_start (as a date) and signup_count. Sort by month.

Use a recursive CTE to generate the month series, then LEFT JOIN to user signups.`,
    starterSql: `-- Generate months with recursive CTE, then LEFT JOIN to user counts\n`,
    expectedSql: `WITH RECURSIVE months AS (
  SELECT DATE '2023-01-01' AS month_start
  UNION ALL
  SELECT (month_start + INTERVAL '1 month')::date
  FROM months
  WHERE month_start < DATE '2024-06-01'
)
SELECT
  m.month_start,
  COUNT(u.id) AS signup_count
FROM months m
LEFT JOIN users u ON DATE_TRUNC('month', u.created_at)::date = m.month_start
GROUP BY m.month_start
ORDER BY m.month_start`,
    explanation:
      "Generating a date series with a recursive CTE and LEFT JOINing ensures months with zero activity still appear. Without the series, months with no signups would be missing.",
    hints: [
      {
        level: 1,
        text: "First, generate the month series using a recursive CTE (similar to the worked example). Then LEFT JOIN users where their created_at falls in that month.",
      },
      {
        level: 2,
        text: "Join condition: `DATE_TRUNC('month', u.created_at)::date = m.month_start`. Use LEFT JOIN so months with no signups show 0.",
      },
      {
        level: 3,
        text: "GROUP BY m.month_start and use COUNT(u.id) — COUNT of a nullable column returns 0 when all values are NULL (no signups that month).",
      },
    ],
    tags: ["cte", "recursive", "left-join", "date-series", "gap-filling"],
  },
  {
    id: "p3-cte-dedup",
    phase: "phase-3",
    order: 6,
    title: "Deduplication With ROW_NUMBER in a CTE",
    concept: "CTE + ROW_NUMBER",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Some users might have multiple subscriptions for the same product. Return only the **most recently started** subscription per user+product combination. Show user_id, product_id, status, and started_at.

**The pattern:** Use ROW_NUMBER() inside a CTE to rank rows within each group, then filter to rank = 1 in the outer query.

\`\`\`sql
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, product_id
      ORDER BY started_at DESC
    ) AS rn
  FROM subscriptions
)
SELECT ... FROM ranked WHERE rn = 1;
\`\`\`

This is the standard SQL deduplication technique — far more robust than using DISTINCT.`,
    starterSql: `-- Use a CTE with ROW_NUMBER to keep only the latest subscription per user+product\n`,
    expectedSql: `WITH ranked AS (
  SELECT
    user_id,
    product_id,
    status,
    started_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, product_id
      ORDER BY started_at DESC
    ) AS rn
  FROM subscriptions
)
SELECT user_id, product_id, status, started_at
FROM ranked
WHERE rn = 1
ORDER BY user_id, product_id`,
    explanation:
      "ROW_NUMBER() assigns 1, 2, 3... within each PARTITION group, ordered by your chosen column. Filtering WHERE rn = 1 keeps only the top row per group. This CTE pattern avoids messy self-joins that were needed before window functions.",
    hints: [
      {
        level: 1,
        text: "Create a CTE that adds ROW_NUMBER() OVER (PARTITION BY user_id, product_id ORDER BY started_at DESC) as a column. Then in the outer query, filter WHERE rn = 1.",
      },
      {
        level: 2,
        text: "Inside the CTE: `ROW_NUMBER() OVER (PARTITION BY user_id, product_id ORDER BY started_at DESC) AS rn`. This numbers rows 1, 2, 3... within each user+product group, newest first.",
      },
      {
        level: 3,
        text: "`WITH ranked AS (SELECT user_id, product_id, status, started_at, ROW_NUMBER() OVER (PARTITION BY user_id, product_id ORDER BY started_at DESC) AS rn FROM subscriptions) SELECT user_id, product_id, status, started_at FROM ranked WHERE rn = 1 ORDER BY user_id, product_id`",
      },
    ],
    tags: ["cte", "row-number", "deduplication", "window-functions"],
  },
  {
    id: "p3-chained-cte",
    phase: "phase-3",
    order: 7,
    title: "Chained CTEs — Multi-Step Pipeline",
    concept: "Multiple Chained CTEs",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Build a 3-step analytics pipeline using chained CTEs:

1. **Step 1:** Compute each user's total spend from completed orders
2. **Step 2:** Compute the overall average spend across all users who have spent anything
3. **Step 3:** Show users whose spend is above average, with their spend and how much above average they are (in dollars)

Sort by spend descending.

Chained CTEs are powerful because each CTE can reference previous ones:
\`\`\`sql
WITH step1 AS (
  ...
),
step2 AS (
  SELECT ... FROM step1 ...
),
step3 AS (
  SELECT ... FROM step1 JOIN step2 ...
)
SELECT * FROM step3;
\`\`\``,
    starterSql: `-- Build a 3-step CTE pipeline\n`,
    expectedSql: `WITH user_spend AS (
  SELECT
    u.id AS user_id,
    u.name,
    SUM(o.total_cents) / 100.0 AS total_spend_dollars
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name
),
avg_spend AS (
  SELECT AVG(total_spend_dollars) AS avg_dollars
  FROM user_spend
),
above_avg AS (
  SELECT
    us.name,
    us.total_spend_dollars,
    ROUND(us.total_spend_dollars - avg.avg_dollars, 2) AS dollars_above_avg
  FROM user_spend us
  CROSS JOIN avg_spend avg
  WHERE us.total_spend_dollars > avg.avg_dollars
)
SELECT * FROM above_avg
ORDER BY total_spend_dollars DESC`,
    explanation:
      "Chained CTEs create a readable pipeline where each step builds on the previous. CROSS JOIN with a single-row aggregate CTE is a clean way to reference a scalar value across all rows — cleaner than a correlated subquery.",
    hints: [
      {
        level: 1,
        text: "Define three CTEs: user_spend (total per user), avg_spend (one-row aggregate of the first CTE), above_avg (filter from step 1 where spend > step 2's average). Each CTE can reference earlier ones.",
      },
      {
        level: 2,
        text: "avg_spend: `SELECT AVG(total_spend_dollars) AS avg_dollars FROM user_spend`. above_avg: `SELECT us.name, us.total_spend_dollars, ROUND(us.total_spend_dollars - avg.avg_dollars, 2) AS dollars_above_avg FROM user_spend us CROSS JOIN avg_spend avg WHERE us.total_spend_dollars > avg.avg_dollars`",
      },
      {
        level: 3,
        text: "Full structure: `WITH user_spend AS (...), avg_spend AS (SELECT AVG(total_spend_dollars) AS avg_dollars FROM user_spend), above_avg AS (SELECT us.name, us.total_spend_dollars, ROUND(us.total_spend_dollars - avg.avg_dollars, 2) AS dollars_above_avg FROM user_spend us CROSS JOIN avg_spend avg WHERE us.total_spend_dollars > avg.avg_dollars) SELECT * FROM above_avg ORDER BY total_spend_dollars DESC`",
      },
    ],
    tags: ["cte", "chained", "pipeline", "advanced", "cross-join"],
  },
  {
    id: "p3-cte-aggregation-reuse",
    phase: "phase-3",
    order: 8,
    title: "Reusing Aggregates Across Multiple Outputs",
    concept: "CTE Aggregation Reuse",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Using a single CTE for product revenue, produce a result that shows:
- Each product's name, category, and total revenue from completed orders (in dollars)
- How that revenue compares to the category's total revenue (as a percentage of category revenue)
- Rank within the category (1 = highest revenue in the category)

Sort by category, then rank.

**The key advantage:** Define the revenue aggregation once in a CTE, then reference it multiple times in the outer query using window functions — no repeated subqueries.`,
    starterSql: `-- Define product revenue in a CTE, then apply window functions over it\n`,
    expectedSql: `WITH product_revenue AS (
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    SUM(oi.quantity * oi.unit_price_cents) / 100.0 AS revenue_dollars
  FROM products p
  INNER JOIN order_items oi ON oi.product_id = p.id
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'completed'
  GROUP BY p.id, p.name, p.category
)
SELECT
  product_name,
  category,
  revenue_dollars,
  ROUND(
    revenue_dollars / SUM(revenue_dollars) OVER (PARTITION BY category) * 100,
    1
  ) AS pct_of_category,
  RANK() OVER (PARTITION BY category ORDER BY revenue_dollars DESC) AS rank_in_category
FROM product_revenue
ORDER BY category, rank_in_category`,
    explanation:
      "CTEs let you compute something once and reference it multiple times. Here product_revenue is aggregated once, then window functions (SUM OVER, RANK OVER) apply additional calculations without re-querying the base tables. This is both readable and efficient.",
    hints: [
      {
        level: 1,
        text: "Create a CTE that aggregates revenue per product by joining products, order_items, and orders. Then in the outer query, apply SUM() OVER (PARTITION BY category) and RANK() OVER (PARTITION BY category ORDER BY revenue_dollars DESC).",
      },
      {
        level: 2,
        text: "Revenue per product: `SUM(oi.quantity * oi.unit_price_cents) / 100.0`. Percentage: `revenue_dollars / SUM(revenue_dollars) OVER (PARTITION BY category) * 100`. Rank: `RANK() OVER (PARTITION BY category ORDER BY revenue_dollars DESC)`.",
      },
      {
        level: 3,
        text: "CTE: `SELECT p.id, p.name, p.category, SUM(oi.quantity * oi.unit_price_cents)/100.0 AS revenue_dollars FROM products p INNER JOIN order_items oi ON oi.product_id = p.id INNER JOIN orders o ON o.id = oi.order_id WHERE o.status = 'completed' GROUP BY p.id, p.name, p.category`",
      },
    ],
    tags: ["cte", "window-functions", "rank", "sum-over", "advanced"],
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p3-quiz-cte-vs-subquery",
    phase: "phase-3",
    order: 9,
    title: "Quiz: CTE vs Subquery",
    concept: "CTEs",
    mode: "quiz",
    difficulty: "intermediate",
    description: `What is the primary advantage of using a **CTE (WITH clause)** over a nested subquery?`,
    expectedSql: "",
    explanation: `CTEs improve **readability** — you give a name to each logical step and refer to it by name instead of nesting queries. Both produce equivalent results in most cases. CTEs can also be referenced multiple times in the same query, whereas a subquery would need to be repeated.`,
    hints: [],
    tags: ["cte", "with", "subquery"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "CTEs improve readability and can be referenced multiple times",
        isCorrect: true,
      },
      { id: "b", text: "CTEs are always faster than subqueries", isCorrect: false },
      { id: "c", text: "CTEs require an index to work", isCorrect: false },
      { id: "d", text: "CTEs cannot be used with GROUP BY", isCorrect: false },
    ],
  },
  {
    id: "p3-quiz-recursive-cte",
    phase: "phase-3",
    order: 10,
    title: "Quiz: Recursive CTE Structure",
    concept: "Recursive CTE",
    mode: "quiz",
    difficulty: "advanced",
    description: `A recursive CTE has two parts separated by \`UNION ALL\`. What are they?`,
    expectedSql: "",
    explanation: `A recursive CTE requires two parts: (1) an **anchor** — the non-recursive base case that starts the recursion, and (2) a **recursive member** — a query that references the CTE itself, adding rows until the termination condition is reached.`,
    hints: [],
    tags: ["cte", "recursive-cte", "with"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "An anchor (base case) UNION ALL a recursive member that references the CTE itself",
        isCorrect: true,
      },
      {
        id: "b",
        text: "A WHERE clause UNION ALL a HAVING clause",
        isCorrect: false,
      },
      {
        id: "c",
        text: "Two identical queries combined with UNION ALL",
        isCorrect: false,
      },
      {
        id: "d",
        text: "A subquery UNION ALL a JOIN",
        isCorrect: false,
      },
    ],
  },
];

export const phase3Exercises: readonly Exercise[] = [...phase3BaseExercises, ...phase3DebugExercises];
