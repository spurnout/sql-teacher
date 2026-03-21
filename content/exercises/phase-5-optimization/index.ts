import type { Exercise } from "@/lib/exercises/types";
import { phase5DebugExercises } from "./debug";

const phase5BaseExercises: readonly Exercise[] = [
  {
    id: "p5-explain-worked",
    phase: "phase-5",
    order: 1,
    title: "Reading EXPLAIN ANALYZE",
    concept: "EXPLAIN ANALYZE",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Understanding Query Plans

**EXPLAIN ANALYZE** runs the query and shows how PostgreSQL actually executed it, including timing.

\`\`\`sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY order_count DESC;
\`\`\`

**Key things to look for in the output:**
- **Seq Scan** vs **Index Scan**: Seq Scan reads every row; Index Scan uses an index
- **actual time**: The real execution time in milliseconds
- **rows**: How many rows each step processed
- **Hash Join** / **Nested Loop** / **Merge Join**: How tables were combined

Run this query and read through the plan output.`,
    starterSql: `EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY order_count DESC;`,
    expectedSql: `EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY order_count DESC`,
    explanation:
      "EXPLAIN ANALYZE is your primary tool for understanding query performance. Always check: scan type (Seq vs Index), join method, and actual vs estimated rows.",
    hints: [],
    tags: ["optimization", "explain", "query-plan"],
    skipValidation: true,
  },
  {
    id: "p5-seq-vs-index",
    phase: "phase-5",
    order: 2,
    title: "Why Is This Slow?",
    concept: "Seq Scan vs Index Scan",
    mode: "open",
    difficulty: "intermediate",
    description: `**Exercise:** Run EXPLAIN ANALYZE on this query that filters events by event_type:

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM events WHERE event_type = 'api_call';
\`\`\`

Notice the **Seq Scan** — PostgreSQL reads every row because there's no index on event_type.

Now, **write a query** (not EXPLAIN) that answers: How many events of each event_type exist? Show event_type and count, sorted by count descending.

(After solving, think about: would an index on event_type help this second query? Why or why not?)`,
    starterSql: `-- First run the EXPLAIN ANALYZE above to see the Seq Scan
-- Then write a query to count events by type\n`,
    expectedSql: `SELECT
  event_type,
  COUNT(*) AS event_count
FROM events
GROUP BY event_type
ORDER BY event_count DESC`,
    explanation:
      "An aggregate query that touches every row won't benefit much from an index — it needs to read all rows anyway. Indexes help most when filtering for a small subset of rows.",
    hints: [
      {
        level: 1,
        text: "Group events by event_type and count them. No EXPLAIN needed for this part.",
      },
      {
        level: 2,
        text: "`SELECT event_type, COUNT(*) AS event_count FROM events GROUP BY event_type`",
      },
      {
        level: 3,
        text: "Add `ORDER BY event_count DESC` to see the most common event types first.",
      },
    ],
    tags: ["optimization", "seq-scan", "index", "aggregation"],
  },
  {
    id: "p5-query-rewrite",
    phase: "phase-5",
    order: 3,
    title: "Correlated to JOIN Rewrite",
    concept: "Query Rewriting",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Find each user's most recent login event date.

Here's the correlated subquery approach (can be slow on large tables):
\`\`\`sql
SELECT u.name,
  (SELECT MAX(e.occurred_at)
   FROM events e
   WHERE e.user_id = u.id AND e.event_type = 'login') AS last_login
FROM users u
WHERE EXISTS (SELECT 1 FROM events e WHERE e.user_id = u.id AND e.event_type = 'login')
ORDER BY u.name;
\`\`\`

**Rewrite this using a JOIN approach** (aggregate in a subquery/CTE first, then join). This pattern often performs better because it scans the events table once instead of once per user.`,
    starterSql: `-- Rewrite the correlated subquery as a JOIN\n`,
    expectedSql: `SELECT
  u.name,
  login_stats.last_login
FROM users u
INNER JOIN (
  SELECT user_id, MAX(occurred_at) AS last_login
  FROM events
  WHERE event_type = 'login'
  GROUP BY user_id
) AS login_stats ON login_stats.user_id = u.id
ORDER BY u.name`,
    explanation:
      "Pre-aggregating in a subquery/CTE and joining is often faster than a correlated subquery because it scans the large table once. The optimizer sometimes does this transformation automatically, but not always.",
    hints: [
      {
        level: 1,
        text: "Create a derived table (or CTE) that calculates MAX(occurred_at) per user_id for login events, then JOIN it to users.",
      },
      {
        level: 2,
        text: "Derived table: `(SELECT user_id, MAX(occurred_at) AS last_login FROM events WHERE event_type = 'login' GROUP BY user_id) AS login_stats`",
      },
      {
        level: 3,
        text: "Join: `INNER JOIN (...) AS login_stats ON login_stats.user_id = u.id`. The INNER JOIN naturally excludes users with no login events.",
      },
    ],
    tags: ["optimization", "rewrite", "correlated-to-join"],
  },
  {
    id: "p5-composite-index",
    phase: "phase-5",
    order: 4,
    title: "When Indexes Help (and When They Don't)",
    concept: "Index Selectivity",
    mode: "open",
    difficulty: "advanced",
    description: `**Exercise:** Compare these two queries using EXPLAIN ANALYZE:

1. \`EXPLAIN ANALYZE SELECT * FROM events WHERE user_id = 1;\`  (uses idx_events_user_id — high selectivity)
2. \`EXPLAIN ANALYZE SELECT * FROM events WHERE event_type = 'login';\`  (no index — low selectivity)

After exploring the plans, **write a query** that finds the 5 users with the most 'api_call' events. Return user name and api_call_count. Sort by count descending.`,
    starterSql: `-- Run the two EXPLAIN ANALYZE queries above first
-- Then write the query for top 5 users by api_call count\n`,
    expectedSql: `SELECT
  u.name,
  COUNT(*) AS api_call_count
FROM users u
INNER JOIN events e ON e.user_id = u.id
WHERE e.event_type = 'api_call'
GROUP BY u.id, u.name
ORDER BY api_call_count DESC
LIMIT 5`,
    explanation:
      "Index selectivity matters: an index on user_id (50 distinct values for 200 rows) is useful because each lookup returns few rows. An index on event_type (5 values) would return ~40 rows each — less beneficial.",
    hints: [
      {
        level: 1,
        text: "Join users to events, filter for api_call event_type, group by user, count, and limit to 5.",
      },
      {
        level: 2,
        text: "`FROM users u INNER JOIN events e ON e.user_id = u.id WHERE e.event_type = 'api_call' GROUP BY u.id, u.name`",
      },
      {
        level: 3,
        text: "Add `ORDER BY api_call_count DESC LIMIT 5` to get the top 5.",
      },
    ],
    tags: ["optimization", "index-selectivity", "explain"],
  },
  {
    id: "p5-partial-index",
    phase: "phase-5",
    order: 5,
    title: "Partial Indexes — Indexing a Subset",
    concept: "Partial Index",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: Partial Indexes

A **partial index** includes only rows that satisfy a WHERE condition. It's smaller, faster to maintain, and more selective than a full index.

**Scenario:** Your app frequently queries for users who have churned (churned_at IS NOT NULL). A full index on \`churned_at\` includes NULL values for active users — wasted space.

\`\`\`sql
-- Full index (indexes ALL rows, including NULL churned_at):
CREATE INDEX idx_users_churned_at ON users (churned_at);

-- Partial index (only indexes rows where churned_at is not null):
CREATE INDEX idx_users_churned_at_partial ON users (churned_at)
  WHERE churned_at IS NOT NULL;
\`\`\`

**When does the partial index help?** When your query's WHERE clause matches the index predicate:

\`\`\`sql
-- This query CAN use the partial index:
SELECT name, email, churned_at
FROM users
WHERE churned_at IS NOT NULL
ORDER BY churned_at DESC;
\`\`\`

Let's check the plan difference. First, run EXPLAIN on the query. In a larger production table, you would see the partial index being used instead of a sequential scan.

\`\`\`sql
EXPLAIN SELECT name, email, churned_at
FROM users
WHERE churned_at IS NOT NULL
ORDER BY churned_at DESC;
\`\`\`

**Other good partial index use cases:**
- \`WHERE status = 'active'\` — index only active rows
- \`WHERE deleted_at IS NULL\` — skip soft-deleted rows
- \`WHERE amount > 0\` — skip zero-value transactions

**Run the EXPLAIN query** to see the current query plan.`,
    starterSql: `EXPLAIN SELECT name, email, churned_at
FROM users
WHERE churned_at IS NOT NULL
ORDER BY churned_at DESC;`,
    expectedSql: `EXPLAIN SELECT name, email, churned_at
FROM users
WHERE churned_at IS NOT NULL
ORDER BY churned_at DESC`,
    explanation:
      "Partial indexes are a powerful optimization tool: smaller size, faster maintenance, and high selectivity for queries that filter on the same condition. They're ideal for soft-delete patterns, status filters, and any column that's NULL for most rows.",
    hints: [],
    tags: ["optimization", "partial-index", "explain", "advanced"],
    skipValidation: true,
  },
  {
    id: "p5-cte-optimization-fence",
    phase: "phase-5",
    order: 6,
    title: "CTEs as Optimization Fences",
    concept: "CTE Optimization Fence",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: CTE Optimization Fence

In PostgreSQL 12+, **non-recursive CTEs are inlined by default** — the optimizer can push predicates into them and optimize them as part of the main query.

However, you can force a CTE to **materialize** (execute independently and cache results) using the \`MATERIALIZED\` keyword. This creates an "optimization fence" — the optimizer cannot see through it.

**When is materialization useful?**
- The CTE is expensive and referenced multiple times
- You want to cache the result to avoid re-running it
- The CTE uses volatile functions and you want consistent results

\`\`\`sql
-- Default (inlined, optimizer can optimize freely):
WITH expensive_cte AS (
  SELECT user_id, COUNT(*) AS event_count
  FROM events
  GROUP BY user_id
)
SELECT * FROM expensive_cte WHERE event_count > 5;

-- Forced materialization (runs the CTE once, caches result):
WITH expensive_cte AS MATERIALIZED (
  SELECT user_id, COUNT(*) AS event_count
  FROM events
  GROUP BY user_id
)
SELECT * FROM expensive_cte WHERE event_count > 5;
\`\`\`

**Compare the plans:**

\`\`\`sql
EXPLAIN WITH user_events AS (
  SELECT user_id, COUNT(*) AS cnt FROM events GROUP BY user_id
)
SELECT * FROM user_events WHERE cnt > 3;
\`\`\`

vs.

\`\`\`sql
EXPLAIN WITH user_events AS MATERIALIZED (
  SELECT user_id, COUNT(*) AS cnt FROM events GROUP BY user_id
)
SELECT * FROM user_events WHERE cnt > 3;
\`\`\`

**Run both EXPLAIN queries** and compare. Look for "CTE Scan" vs inlined aggregation in the plans.`,
    starterSql: `-- Compare: inlined CTE
EXPLAIN WITH user_events AS (
  SELECT user_id, COUNT(*) AS cnt FROM events GROUP BY user_id
)
SELECT * FROM user_events WHERE cnt > 3;`,
    expectedSql: `EXPLAIN WITH user_events AS (
  SELECT user_id, COUNT(*) AS cnt FROM events GROUP BY user_id
)
SELECT * FROM user_events WHERE cnt > 3`,
    explanation:
      "PostgreSQL 12+ inlines non-recursive CTEs by default, allowing the optimizer to push filters inside. MATERIALIZED forces the CTE to run first and cache results. Use it when you know the CTE is expensive and referenced multiple times, or when you need the isolation guarantee.",
    hints: [],
    tags: ["optimization", "cte", "materialized", "explain", "advanced"],
    skipValidation: true,
  },
  {
    id: "p5-missing-index-detection",
    phase: "phase-5",
    order: 7,
    title: "Finding Missing Indexes",
    concept: "Sequential Scan Detection",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Write an EXPLAIN ANALYZE query to identify whether a sequential scan or index scan is used when looking up all events for a specific user. Then, check what indexes exist on the events table.

**Step 1:** Run EXPLAIN ANALYZE on this query:
\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM events WHERE user_id = 5;
\`\`\`

**Step 2:** Check existing indexes on the events table using the \`pg_indexes\` system view:
\`\`\`sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'events';
\`\`\`

**Your task:** Write the pg_indexes query (Step 2) to discover what indexes exist. Identify from the results whether \`user_id\` has an index. If it does, the EXPLAIN should show an Index Scan; if not, you'd need to create one.

> In a real scenario, adding \`CREATE INDEX idx_events_user_id ON events(user_id);\` would dramatically speed up per-user lookups.`,
    starterSql: `-- Check what indexes exist on the events table\n`,
    expectedSql: `SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'events'`,
    explanation:
      "pg_indexes is a system view that shows all indexes. Checking it helps identify missing indexes. When EXPLAIN ANALYZE shows 'Seq Scan' on a frequently-filtered column in large tables, that's a strong signal that an index would help. The trade-off: indexes speed reads but slow writes.",
    hints: [
      {
        level: 1,
        text: "Query the pg_indexes system view to see all indexes on the events table. Filter by tablename = 'events'.",
      },
      {
        level: 2,
        text: "`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'events'` — this returns all indexes defined on the events table.",
      },
      {
        level: 3,
        text: "`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'events'` — look at the indexdef column to see which columns are indexed.",
      },
    ],
    tags: ["optimization", "index", "pg-indexes", "explain", "advanced"],
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p5-quiz-seq-vs-index-scan",
    phase: "phase-5",
    order: 8,
    title: "Quiz: Seq Scan vs Index Scan",
    concept: "Query Optimization",
    mode: "quiz",
    difficulty: "advanced",
    description: `When does PostgreSQL prefer a **sequential scan** over an **index scan** for a query like \`SELECT * FROM users WHERE plan = 'pro'\`?`,
    expectedSql: "",
    explanation: `PostgreSQL uses a **sequential scan** when the query would return a large percentage of rows (low selectivity). If \`plan = 'pro'\` matches 60% of users, reading the whole table is faster than bouncing back and forth with an index. Indexes help most when filtering for a small subset of rows.`,
    hints: [],
    tags: ["explain", "optimization", "index"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "When the filter has low selectivity (many rows match, e.g. 60% of the table)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "When there is no PRIMARY KEY on the table",
        isCorrect: false,
      },
      {
        id: "c",
        text: "When the table has fewer than 1000 rows",
        isCorrect: false,
      },
      {
        id: "d",
        text: "Sequential scans are always chosen for SELECT * queries",
        isCorrect: false,
      },
    ],
  },
  {
    id: "p5-quiz-explain-cost",
    phase: "phase-5",
    order: 9,
    title: "Quiz: Reading EXPLAIN Output",
    concept: "EXPLAIN ANALYZE",
    mode: "quiz",
    difficulty: "advanced",
    description: `In \`EXPLAIN ANALYZE\` output, you see \`cost=0.00..8.27\`. What do these two numbers mean?`,
    expectedSql: "",
    explanation: `The \`cost\` field has two numbers: **startup cost** (cost before returning the first row, e.g., sorting or building a hash table) and **total cost** (estimated cost to return all rows). Lower is better. Actual times appear after \`actual time=\`.`,
    hints: [],
    tags: ["explain", "explain-analyze", "optimization"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "Startup cost (before first row) .. Total cost (all rows returned)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "Minimum possible cost .. Maximum possible cost",
        isCorrect: false,
      },
      {
        id: "c",
        text: "CPU cost .. I/O cost",
        isCorrect: false,
      },
      {
        id: "d",
        text: "Estimated rows .. Actual rows",
        isCorrect: false,
      },
    ],
  },
];

export const phase5Exercises: readonly Exercise[] = [...phase5BaseExercises, ...phase5DebugExercises];
