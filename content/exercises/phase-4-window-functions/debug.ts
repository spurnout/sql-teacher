import type { Exercise } from "@/lib/exercises/types";

export const phase4DebugExercises: readonly Exercise[] = [
  {
    id: "p4-debug-wrong-partition",
    phase: "phase-4",
    order: 12,
    title: "Bug Fix: Wrong PARTITION BY Column",
    concept: "PARTITION BY",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query ranks users by their total spending **within each plan**. But the ranking is across all users instead of per-plan — everyone gets a unique rank regardless of their plan.

**Expected:** Separate rankings per plan (e.g., rank 1 for each plan's top spender).

**Run the buggy query**, notice that ranks go from 1 to N globally, and **fix** the window function.`,
    starterSql: `SELECT
  u.name,
  u.plan,
  SUM(o.total_cents) / 100.0 AS total_spent,
  RANK() OVER (ORDER BY SUM(o.total_cents) DESC) AS plan_rank
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.plan
ORDER BY u.plan, plan_rank;`,
    expectedSql: `SELECT
  u.name,
  u.plan,
  SUM(o.total_cents) / 100.0 AS total_spent,
  RANK() OVER (PARTITION BY u.plan ORDER BY SUM(o.total_cents) DESC) AS plan_rank
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.plan
ORDER BY u.plan, plan_rank`,
    explanation:
      "Without `PARTITION BY u.plan`, the RANK() function operates over the entire result set as one partition. Adding `PARTITION BY u.plan` resets the ranking for each plan group.",
    bugDescription:
      "The window function was missing `PARTITION BY u.plan`. Without it, RANK() assigns a single global ranking instead of separate rankings per plan. The OVER clause needs `PARTITION BY u.plan` before the ORDER BY.",
    hints: [
      { level: 1, text: "Look at the OVER clause. Is it partitioning the data by plan?" },
      { level: 2, text: "The window function needs `PARTITION BY u.plan` to rank within each plan group." },
      { level: 3, text: "Change `OVER (ORDER BY ...)` to `OVER (PARTITION BY u.plan ORDER BY ...)` in the RANK() function." },
    ],
    tags: ["window-function", "partition-by", "rank", "debug"],
  },
  {
    id: "p4-debug-missing-window-order",
    phase: "phase-4",
    order: 13,
    title: "Bug Fix: Missing ORDER BY in Window",
    concept: "Window Frame",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should compute a **running total** of order amounts per user, ordered by date. But every row shows the same total — the running sum isn't accumulating progressively.

**Expected:** Each row should show the cumulative total up to that order's date.

**Run the buggy query**, notice all rows for a user have the same sum, and **fix** the window function.`,
    starterSql: `SELECT
  u.name,
  o.created_at::date AS order_date,
  o.total_cents / 100.0 AS order_total,
  SUM(o.total_cents / 100.0) OVER (PARTITION BY u.id) AS running_total
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
ORDER BY u.name, o.created_at;`,
    expectedSql: `SELECT
  u.name,
  o.created_at::date AS order_date,
  o.total_cents / 100.0 AS order_total,
  SUM(o.total_cents / 100.0) OVER (PARTITION BY u.id ORDER BY o.created_at) AS running_total
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
ORDER BY u.name, o.created_at`,
    explanation:
      "Without ORDER BY in the window frame, SUM() OVER (PARTITION BY u.id) computes the total for the entire partition — making every row show the grand total. Adding ORDER BY o.created_at makes it accumulate row by row.",
    bugDescription:
      "The window function lacked `ORDER BY o.created_at` inside the OVER clause. Without it, the window frame includes all rows in the partition, so SUM produces the same total for every row. Adding ORDER BY creates the progressive running total.",
    hints: [
      { level: 1, text: "For a running total, the window function needs to know the order of accumulation. Is there an ORDER BY in the OVER clause?" },
      { level: 2, text: "Add `ORDER BY o.created_at` inside the OVER clause, after `PARTITION BY u.id`." },
      { level: 3, text: "Change `OVER (PARTITION BY u.id)` to `OVER (PARTITION BY u.id ORDER BY o.created_at)`." },
    ],
    tags: ["window-function", "running-total", "order-by", "debug"],
  },
  {
    id: "p4-debug-lag-wrong-default",
    phase: "phase-4",
    order: 14,
    title: "Bug Fix: LAG Function Missing Default",
    concept: "LAG / LEAD",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query computes month-over-month revenue growth. The LAG function fetches the previous month's revenue to calculate the change, but the first month shows **NULL** for growth instead of showing the revenue itself as the baseline (growth of 0).

**Expected:** First month should show \`0\` for growth (no previous month to compare), not NULL.

**Run the buggy query**, notice the NULL in the first row, and **fix** the LAG function.`,
    starterSql: `SELECT
  month,
  revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS growth
FROM (
  SELECT
    DATE_TRUNC('month', created_at)::date AS month,
    SUM(total_cents) / 100.0 AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)
) AS monthly
ORDER BY month;`,
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
    explanation:
      "LAG(revenue) returns NULL for the first row since there's no previous row. By providing a default value — `LAG(revenue, 1, revenue)` — the first row uses its own revenue as the 'previous' value, making the growth calculation 0 instead of NULL.",
    bugDescription:
      "The LAG function had no default value for the first row. `LAG(revenue)` returns NULL when there's no previous row, causing the subtraction to produce NULL. Using `LAG(revenue, 1, revenue)` sets the default to the current row's revenue, yielding a growth of 0.",
    hints: [
      { level: 1, text: "What does LAG return when there is no previous row? Can you specify a default?" },
      { level: 2, text: "LAG accepts a third argument: `LAG(column, offset, default)`. What default would make the first month's growth be 0?" },
      { level: 3, text: "Change `LAG(revenue)` to `LAG(revenue, 1, revenue)` — when there's no previous row, use the current revenue as the default, making growth = 0." },
    ],
    tags: ["window-function", "lag", "default", "debug"],
  },
];
