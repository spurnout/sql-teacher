import type { Exercise } from "@/lib/exercises/types";
import { phase4DebugExercises } from "./debug";

const phase4BaseExercises: readonly Exercise[] = [
  {
    id: "p4-row-number-worked",
    phase: "phase-4",
    order: 1,
    title: "How Window Functions Work",
    concept: "ROW_NUMBER()",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Ranking Users by Total Spend

A **window function** performs a calculation across a set of rows related to the current row — without collapsing them into groups.

\`\`\`sql
SELECT
  u.name,
  SUM(o.total_cents) / 100.0 AS total_spend,
  ROW_NUMBER() OVER (ORDER BY SUM(o.total_cents) DESC) AS spend_rank
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY spend_rank;
\`\`\`

**Key insight:** Unlike GROUP BY alone, the window function adds a ranking column without removing rows. The \`OVER()\` clause defines the window — here it orders all rows by total spend.`,
    starterSql: `SELECT
  u.name,
  SUM(o.total_cents) / 100.0 AS total_spend,
  ROW_NUMBER() OVER (ORDER BY SUM(o.total_cents) DESC) AS spend_rank
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY spend_rank;`,
    expectedSql: `SELECT
  u.name,
  SUM(o.total_cents) / 100.0 AS total_spend,
  ROW_NUMBER() OVER (ORDER BY SUM(o.total_cents) DESC) AS spend_rank
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY spend_rank`,
    explanation:
      "ROW_NUMBER() assigns sequential integers. OVER(ORDER BY ...) determines the ranking order. The window function runs after GROUP BY, so you can use aggregates inside OVER().",
    hints: [],
    tags: ["window", "row-number", "ranking"],
    skipValidation: true,
  },
  {
    id: "p4-rank-vs-dense",
    phase: "phase-4",
    order: 2,
    title: "RANK vs DENSE_RANK",
    concept: "RANK, DENSE_RANK",
    mode: "scaffolded",
    difficulty: "intermediate",
    description: `**Business question:** Rank products by total revenue from completed orders. Show product name, total revenue in dollars, and three ranking columns: row_number, rank, and dense_rank. Sort by revenue descending.

This will show how the three functions handle ties differently.`,
    starterSql: `SELECT
  p.name,
  SUM(oi.quantity * oi.unit_price_cents) / 100.0 AS total_revenue,
  ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rn,
  ____(____) AS rnk,
  ____(____) AS dense_rnk
FROM products p
INNER JOIN order_items oi ON oi.product_id = p.id
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC;`,
    expectedSql: `SELECT
  p.name,
  SUM(oi.quantity * oi.unit_price_cents) / 100.0 AS total_revenue,
  ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rn,
  RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS dense_rnk
FROM products p
INNER JOIN order_items oi ON oi.product_id = p.id
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY p.id, p.name
ORDER BY total_revenue DESC`,
    explanation:
      "ROW_NUMBER gives unique sequential numbers. RANK gives the same number to ties but skips the next (1,2,2,4). DENSE_RANK gives ties the same number without gaps (1,2,2,3).",
    hints: [
      {
        level: 1,
        text: "The blanks need RANK() and DENSE_RANK() window functions with the same OVER clause as ROW_NUMBER().",
      },
      {
        level: 2,
        text: "First blank: `RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC)`. Second is similar with DENSE_RANK().",
      },
      {
        level: 3,
        text: "`RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS rnk` and `DENSE_RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price_cents) DESC) AS dense_rnk`",
      },
    ],
    tags: ["window", "rank", "dense-rank", "comparison"],
  },
  {
    id: "p4-partition",
    phase: "phase-4",
    order: 3,
    title: "Rank Within Country",
    concept: "PARTITION BY",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Rank users by their total completed order spend **within each country**. Show country, user name, total spend in dollars, and their rank within their country. Sort by country, then rank.`,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  u.country,
  u.name,
  SUM(o.total_cents) / 100.0 AS total_spend,
  RANK() OVER (PARTITION BY u.country ORDER BY SUM(o.total_cents) DESC) AS country_rank
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.country
ORDER BY u.country, country_rank`,
    explanation:
      "PARTITION BY divides rows into groups (like GROUP BY for the window). The ranking restarts at 1 for each partition. Here each country gets its own independent ranking.",
    hints: [
      {
        level: 1,
        text: "Use `PARTITION BY u.country` inside the OVER() clause to create separate rankings per country.",
      },
      {
        level: 2,
        text: "`RANK() OVER (PARTITION BY u.country ORDER BY SUM(o.total_cents) DESC) AS country_rank`",
      },
      {
        level: 3,
        text: "GROUP BY u.id, u.name, u.country (need country in GROUP BY since it's in SELECT). ORDER BY u.country, country_rank.",
      },
    ],
    tags: ["window", "partition-by", "rank"],
  },
  {
    id: "p4-lag-lead",
    phase: "phase-4",
    order: 4,
    title: "Month-Over-Month Revenue Change",
    concept: "LAG / LEAD",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Show monthly revenue from completed orders and the month-over-month change in dollars. Return month (as date), revenue_dollars, prev_month_revenue, and change_dollars (current minus previous). Sort by month.

Use **LAG()** to access the previous row's value.`,
    starterSql: `-- Write your query here using LAG()\n`,
    expectedSql: `WITH monthly AS (
  SELECT
    DATE_TRUNC('month', created_at)::date AS month,
    SUM(total_cents) / 100.0 AS revenue_dollars
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE_TRUNC('month', created_at)::date
)
SELECT
  month,
  revenue_dollars,
  LAG(revenue_dollars) OVER (ORDER BY month) AS prev_month_revenue,
  revenue_dollars - LAG(revenue_dollars) OVER (ORDER BY month) AS change_dollars
FROM monthly
ORDER BY month`,
    explanation:
      "LAG(column) OVER (ORDER BY ...) returns the value from the previous row. LEAD() returns the next row's value. The first row has NULL for LAG (no previous row exists).",
    hints: [
      {
        level: 1,
        text: "First aggregate monthly revenue in a CTE, then use LAG() in the outer query to access the previous month's revenue.",
      },
      {
        level: 2,
        text: "`LAG(revenue_dollars) OVER (ORDER BY month)` gives you the previous month's revenue. Subtract it from current to get the change.",
      },
      {
        level: 3,
        text: "Full expression: `revenue_dollars - LAG(revenue_dollars) OVER (ORDER BY month) AS change_dollars`",
      },
    ],
    tags: ["window", "lag", "lead", "time-series"],
  },
  {
    id: "p4-running-total",
    phase: "phase-4",
    order: 5,
    title: "Cumulative Revenue",
    concept: "Running Total",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Show a running total of completed order revenue by date. Return created_at (the order date), order total in dollars, and the cumulative revenue up to and including that order. Sort by created_at, then by order id.`,
    starterSql: `-- Write your query here using SUM() OVER()\n`,
    expectedSql: `SELECT
  o.created_at,
  o.total_cents / 100.0 AS order_dollars,
  SUM(o.total_cents) OVER (ORDER BY o.created_at, o.id) / 100.0 AS cumulative_revenue
FROM orders o
WHERE o.status = 'completed'
ORDER BY o.created_at, o.id`,
    explanation:
      "SUM() OVER (ORDER BY ...) creates a running total. The default frame is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which accumulates all previous rows.",
    hints: [
      {
        level: 1,
        text: "Use `SUM(o.total_cents) OVER (ORDER BY o.created_at, o.id)` to create a running total that accumulates with each row.",
      },
      {
        level: 2,
        text: "No PARTITION BY needed — we want one cumulative total across all orders. ORDER BY both created_at and id for deterministic ordering.",
      },
      {
        level: 3,
        text: "Divide by 100.0 after the window function: `SUM(o.total_cents) OVER (ORDER BY o.created_at, o.id) / 100.0 AS cumulative_revenue`",
      },
    ],
    tags: ["window", "running-total", "sum-over"],
  },
  {
    id: "p4-frame-clause",
    phase: "phase-4",
    order: 6,
    title: "3-Month Moving Average Signups",
    concept: "Frame Clause",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Calculate a 3-month moving average of user signups. Show each month (as date), the signup count, and the moving average (current month + 2 preceding months). Sort by month.

Use a **frame clause** in your window function: \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\`.`,
    starterSql: `-- Write your query here with a frame clause\n`,
    expectedSql: `WITH monthly_signups AS (
  SELECT
    DATE_TRUNC('month', created_at)::date AS month,
    COUNT(*) AS signup_count
  FROM users
  GROUP BY DATE_TRUNC('month', created_at)::date
)
SELECT
  month,
  signup_count,
  ROUND(AVG(signup_count) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3m
FROM monthly_signups
ORDER BY month`,
    explanation:
      "Frame clauses like `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` define exactly which rows the window function considers. This creates a rolling 3-month window.",
    hints: [
      {
        level: 1,
        text: "First aggregate monthly signups in a CTE. Then use AVG() with a frame clause in the outer query.",
      },
      {
        level: 2,
        text: "`AVG(signup_count) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` — this averages the current row and the two before it.",
      },
      {
        level: 3,
        text: "Wrap in ROUND(..., 2) for cleaner output: `ROUND(AVG(signup_count) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3m`",
      },
    ],
    tags: ["window", "frame-clause", "moving-average"],
  },
  {
    id: "p4-ntile",
    phase: "phase-4",
    order: 7,
    title: "Bucketing With NTILE",
    concept: "NTILE",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Divide all users who have placed at least one completed order into 4 equal spending quartiles based on their total spend. Return:
- user name
- total spend in dollars
- quartile number (1 = lowest, 4 = highest)
- a human-readable label: Q1 (Bottom 25%), Q2, Q3, Q4 (Top 25%)

Sort by total spend descending.

**NTILE(n)** divides ordered rows into n roughly equal buckets and assigns each row a bucket number from 1 to n.

\`\`\`sql
-- Example: divide into 4 quartiles by salary
NTILE(4) OVER (ORDER BY salary DESC) AS quartile
\`\`\``,
    starterSql: `-- Use NTILE(4) to assign spending quartiles\n`,
    expectedSql: `WITH user_spend AS (
  SELECT
    u.name,
    SUM(o.total_cents) / 100.0 AS total_spend_dollars
  FROM users u
  INNER JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.id, u.name
)
SELECT
  name,
  total_spend_dollars,
  NTILE(4) OVER (ORDER BY total_spend_dollars) AS quartile,
  CASE NTILE(4) OVER (ORDER BY total_spend_dollars)
    WHEN 1 THEN 'Q1 (Bottom 25%)'
    WHEN 2 THEN 'Q2'
    WHEN 3 THEN 'Q3'
    WHEN 4 THEN 'Q4 (Top 25%)'
  END AS quartile_label
FROM user_spend
ORDER BY total_spend_dollars DESC`,
    explanation:
      "NTILE(n) splits rows into n equal-ish groups based on the ORDER BY in the OVER clause. It's perfect for creating quartiles, deciles, or any equal-bucket grouping. Note: NTILE orders ascending by default — NTILE(4) OVER (ORDER BY spend) means Q1 = lowest spenders.",
    hints: [
      {
        level: 1,
        text: "First aggregate total spend per user (with a CTE or subquery). Then apply NTILE(4) OVER (ORDER BY total_spend_dollars) to divide users into 4 groups. Use CASE to add the label.",
      },
      {
        level: 2,
        text: "Use a CTE to compute user_spend, then in the outer SELECT add both: `NTILE(4) OVER (ORDER BY total_spend_dollars) AS quartile` and a CASE expression for the label. Both can use the same OVER clause.",
      },
      {
        level: 3,
        text: "NTILE orders ascending (Q1 = lowest). Label with: `CASE NTILE(4) OVER (ORDER BY total_spend_dollars) WHEN 1 THEN 'Q1 (Bottom 25%)' WHEN 2 THEN 'Q2' WHEN 3 THEN 'Q3' WHEN 4 THEN 'Q4 (Top 25%)' END`",
      },
    ],
    tags: ["window", "ntile", "quartile", "bucketing"],
  },
  {
    id: "p4-first-last-value",
    phase: "phase-4",
    order: 8,
    title: "FIRST_VALUE and LAST_VALUE",
    concept: "FIRST_VALUE / LAST_VALUE",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: FIRST_VALUE and LAST_VALUE

**FIRST_VALUE(col) OVER (...)** returns the value from the first row in the window frame.
**LAST_VALUE(col) OVER (...)** returns the value from the last row in the window frame.

**Critical gotcha:** LAST_VALUE uses the default frame \`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`, which only includes rows up to the current one. To get the true last value in the partition, you must change the frame:

\`\`\`sql
LAST_VALUE(col) OVER (
  PARTITION BY ...
  ORDER BY ...
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
\`\`\`

**Business question:** For each completed order, show:
- The order total in dollars
- The smallest order total for that user (FIRST_VALUE ordered by total ASC)
- The largest order total for that user (LAST_VALUE ordered by total ASC, with correct frame)
- The difference between this order and that user's largest order

\`\`\`sql
SELECT
  u.name,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  FIRST_VALUE(o.total_cents / 100.0) OVER w AS smallest_order,
  LAST_VALUE(o.total_cents / 100.0) OVER w AS largest_order,
  ROUND(
    LAST_VALUE(o.total_cents / 100.0) OVER w
    - o.total_cents / 100.0, 2
  ) AS gap_from_largest
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
WINDOW w AS (
  PARTITION BY o.user_id
  ORDER BY o.total_cents
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY u.name, o.total_cents;
\`\`\`

Note the **named WINDOW clause** (\`WINDOW w AS (...)\`) — it lets you reuse the same window definition multiple times. **Run it** to explore.`,
    starterSql: `SELECT
  u.name,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  FIRST_VALUE(o.total_cents / 100.0) OVER w AS smallest_order,
  LAST_VALUE(o.total_cents / 100.0) OVER w AS largest_order,
  ROUND(
    LAST_VALUE(o.total_cents / 100.0) OVER w
    - o.total_cents / 100.0, 2
  ) AS gap_from_largest
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
WINDOW w AS (
  PARTITION BY o.user_id
  ORDER BY o.total_cents
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY u.name, o.total_cents;`,
    expectedSql: `SELECT
  u.name,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  FIRST_VALUE(o.total_cents / 100.0) OVER w AS smallest_order,
  LAST_VALUE(o.total_cents / 100.0) OVER w AS largest_order,
  ROUND(
    LAST_VALUE(o.total_cents / 100.0) OVER w
    - o.total_cents / 100.0, 2
  ) AS gap_from_largest
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
WINDOW w AS (
  PARTITION BY o.user_id
  ORDER BY o.total_cents
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY u.name, o.total_cents`,
    explanation:
      "FIRST_VALUE and LAST_VALUE extract boundary values from a window. The named WINDOW clause (WINDOW w AS ...) avoids repeating the same OVER definition. LAST_VALUE requires ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to see all rows in the partition.",
    hints: [],
    tags: ["window", "first-value", "last-value", "named-window", "frame-clause"],
    skipValidation: true,
  },
  {
    id: "p4-named-window",
    phase: "phase-4",
    order: 9,
    title: "Named WINDOW Clause",
    concept: "Named WINDOW",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** For each event, compute the following statistics **within each user's events**, ordered by time:
- Row number (position of this event in the user's history)
- Running count of events so far
- The event type of their very first event ever
- The event type of their very last event ever

Return: user_id, event_type, occurred_at, rn, running_count, first_event, last_event.

**The challenge:** You need 4 window functions, all using the same partitioning and ordering. Define a **named WINDOW** clause to avoid repeating yourself.

\`\`\`sql
-- Named window syntax (at the end of the query):
WINDOW win AS (
  PARTITION BY user_id
  ORDER BY occurred_at
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
-- Then reference it in SELECT:
ROW_NUMBER() OVER win
\`\`\``,
    starterSql: `-- Use a named WINDOW clause shared by all 4 window functions\n`,
    expectedSql: `SELECT
  user_id,
  event_type,
  occurred_at,
  ROW_NUMBER() OVER win AS rn,
  COUNT(*) OVER (PARTITION BY user_id ORDER BY occurred_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_count,
  FIRST_VALUE(event_type) OVER win AS first_event,
  LAST_VALUE(event_type) OVER win AS last_event
FROM events
WINDOW win AS (
  PARTITION BY user_id
  ORDER BY occurred_at
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY user_id, occurred_at`,
    explanation:
      "The WINDOW clause defines a named window specification reusable across multiple OVER references. Note that running_count uses a separate frame (CURRENT ROW) so it can't share the same named window as FIRST/LAST_VALUE — a good reminder that window functions can have different frame requirements.",
    hints: [
      {
        level: 1,
        text: "Define `WINDOW win AS (PARTITION BY user_id ORDER BY occurred_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)` at the end of the query. Use it for ROW_NUMBER, FIRST_VALUE, and LAST_VALUE.",
      },
      {
        level: 2,
        text: "ROW_NUMBER() OVER win, FIRST_VALUE(event_type) OVER win, LAST_VALUE(event_type) OVER win all work with the named window. For running_count, use COUNT(*) OVER (PARTITION BY user_id ORDER BY occurred_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) — a different frame.",
      },
      {
        level: 3,
        text: "The full SELECT: `ROW_NUMBER() OVER win AS rn, COUNT(*) OVER (PARTITION BY user_id ORDER BY occurred_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_count, FIRST_VALUE(event_type) OVER win AS first_event, LAST_VALUE(event_type) OVER win AS last_event`",
      },
    ],
    tags: ["window", "named-window", "row-number", "first-value", "last-value", "advanced"],
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p4-quiz-window-vs-group",
    phase: "phase-4",
    order: 10,
    title: "Quiz: Window Functions vs GROUP BY",
    concept: "Window Functions",
    mode: "quiz",
    difficulty: "intermediate",
    description: `You want to show each order's total AND the running total so far, keeping one row per order. Which approach should you use?`,
    expectedSql: "",
    explanation: `Window functions (using \`OVER\`) are the right choice here. \`GROUP BY\` collapses rows into groups, so you'd lose individual order rows. Window functions operate across a set of rows but keep all rows in the output.`,
    hints: [],
    tags: ["window-functions", "window", "group-by"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "SUM(total_cents) OVER (ORDER BY created_at) — window function",
        isCorrect: true,
      },
      {
        id: "b",
        text: "GROUP BY order_id with SUM(total_cents)",
        isCorrect: false,
      },
      {
        id: "c",
        text: "A subquery for each row",
        isCorrect: false,
      },
      {
        id: "d",
        text: "HAVING SUM(total_cents) > 0",
        isCorrect: false,
      },
    ],
  },
  {
    id: "p4-quiz-rank-vs-dense-rank",
    phase: "phase-4",
    order: 11,
    title: "Quiz: RANK vs DENSE_RANK",
    concept: "RANK vs DENSE_RANK",
    mode: "quiz",
    difficulty: "intermediate",
    description: `Three rows have scores: 100, 100, 80. Using **RANK()**, what ranks are assigned?`,
    expectedSql: "",
    explanation: `\`RANK()\` assigns rank 1, 1, 3 — the two tied rows both get rank 1, and the next rank (2) is skipped. \`DENSE_RANK()\` would assign 1, 1, 2 — no gaps. Use \`DENSE_RANK()\` when you don't want gaps in ranking.`,
    hints: [],
    tags: ["window-functions", "rank", "dense-rank"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "1, 1, 3 (rank 2 is skipped)", isCorrect: true },
      { id: "b", text: "1, 1, 2 (no gaps)", isCorrect: false },
      { id: "c", text: "1, 2, 3 (each gets a unique rank)", isCorrect: false },
      { id: "d", text: "0, 0, 1 (0-indexed)", isCorrect: false },
    ],
  },
];

export const phase4Exercises: readonly Exercise[] = [...phase4BaseExercises, ...phase4DebugExercises];
