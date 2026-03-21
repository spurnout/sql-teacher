import type { Exercise } from "@/lib/exercises/types";
import { phase2DebugExercises } from "./debug";

const phase2BaseExercises: readonly Exercise[] = [
  {
    id: "p2-scalar-worked",
    phase: "phase-2",
    order: 1,
    title: "Scalar Subquery in SELECT",
    concept: "Scalar Subquery",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Adding a Computed Column With a Subquery

A **scalar subquery** returns a single value and can be used in SELECT as a computed column.

**Business question:** Show each user's name, plan, and the platform-wide average order total (in dollars) as a comparison column.

\`\`\`sql
SELECT
  u.name,
  u.plan,
  (SELECT AVG(o.total_cents) / 100.0 FROM orders o WHERE o.status = 'completed')
    AS platform_avg_dollars
FROM users u
WHERE u.plan != 'free'
ORDER BY u.name;
\`\`\`

The subquery runs once and returns the same value for every row. This is useful for comparisons.`,
    starterSql: `SELECT
  u.name,
  u.plan,
  (SELECT AVG(o.total_cents) / 100.0 FROM orders o WHERE o.status = 'completed')
    AS platform_avg_dollars
FROM users u
WHERE u.plan != 'free'
ORDER BY u.name;`,
    expectedSql: `SELECT
  u.name,
  u.plan,
  (SELECT AVG(o.total_cents) / 100.0 FROM orders o WHERE o.status = 'completed')
    AS platform_avg_dollars
FROM users u
WHERE u.plan != 'free'
ORDER BY u.name`,
    explanation:
      "A scalar subquery returns exactly one value. It can appear in SELECT, WHERE, or HAVING. Here it computes a platform-wide average that every row can reference.",
    hints: [],
    tags: ["subquery", "scalar", "avg"],
    skipValidation: true,
  },
  {
    id: "p2-derived-table",
    phase: "phase-2",
    order: 2,
    title: "Users Above Average Order Value",
    concept: "Derived Table",
    mode: "scaffolded",
    difficulty: "intermediate",
    description: `**Business question:** Find users whose average completed order value is above the platform's overall average completed order value. Show name, email, and their personal average order value in dollars. Sort by personal average descending.`,
    starterSql: `SELECT
  u.name,
  u.email,
  AVG(o.total_cents) / 100.0 AS avg_order_dollars
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.email
HAVING AVG(o.total_cents) > (____)
ORDER BY avg_order_dollars DESC;`,
    expectedSql: `SELECT
  u.name,
  u.email,
  AVG(o.total_cents) / 100.0 AS avg_order_dollars
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.email
HAVING AVG(o.total_cents) > (SELECT AVG(total_cents) FROM orders WHERE status = 'completed')
ORDER BY avg_order_dollars DESC`,
    explanation:
      "A subquery in HAVING compares each group's aggregate against a global aggregate. The subquery computes the platform average, then HAVING filters groups above it.",
    hints: [
      {
        level: 1,
        text: "The blank needs a subquery that returns the platform-wide average order total in cents.",
      },
      {
        level: 2,
        text: "Use `SELECT AVG(total_cents) FROM orders WHERE status = 'completed'` as the subquery inside HAVING.",
      },
      {
        level: 3,
        text: "The complete HAVING clause: `HAVING AVG(o.total_cents) > (SELECT AVG(total_cents) FROM orders WHERE status = 'completed')`",
      },
    ],
    tags: ["subquery", "derived-table", "having", "avg"],
  },
  {
    id: "p2-correlated",
    phase: "phase-2",
    order: 3,
    title: "Most Recent Event Per User",
    concept: "Correlated Subquery",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** For each user who has events, show their name and the event_type of their most recent event. Sort by user name.

A **correlated subquery** references the outer query — it runs once per row, not once total.`,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  u.name,
  e.event_type AS latest_event_type
FROM users u
INNER JOIN events e ON e.user_id = u.id
WHERE e.occurred_at = (
  SELECT MAX(e2.occurred_at)
  FROM events e2
  WHERE e2.user_id = u.id
)
ORDER BY u.name`,
    explanation:
      "The correlated subquery `WHERE e2.user_id = u.id` references the outer query's `u.id`. It runs for each user to find their max event timestamp, then the outer query matches that row.",
    hints: [
      {
        level: 1,
        text: "Join users to events, then use a subquery in WHERE to filter for only the row where occurred_at equals the MAX for that user.",
      },
      {
        level: 2,
        text: "The subquery should be: `(SELECT MAX(e2.occurred_at) FROM events e2 WHERE e2.user_id = u.id)` — it references `u.id` from the outer query.",
      },
      {
        level: 3,
        text: "`WHERE e.occurred_at = (SELECT MAX(e2.occurred_at) FROM events e2 WHERE e2.user_id = u.id)` — this is the correlated subquery pattern.",
      },
    ],
    tags: ["subquery", "correlated", "max", "events"],
  },
  {
    id: "p2-exists",
    phase: "phase-2",
    order: 4,
    title: "Buyers Without Active Subscriptions",
    concept: "EXISTS / NOT EXISTS",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Find users who have placed at least one completed order but have NO active subscription. Return their name, email, and plan. Sort by name.

Use **EXISTS** and **NOT EXISTS** to solve this.`,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  u.name,
  u.email,
  u.plan
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'completed'
)
AND NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active'
)
ORDER BY u.name`,
    explanation:
      "EXISTS returns true if the subquery returns any rows. NOT EXISTS returns true if the subquery returns zero rows. Both are correlated — they reference u.id from the outer query.",
    hints: [
      {
        level: 1,
        text: "Use EXISTS to check for completed orders and NOT EXISTS to check for the absence of active subscriptions. Both subqueries should reference the outer user's id.",
      },
      {
        level: 2,
        text: "`WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'completed')` checks that the user has at least one completed order.",
      },
      {
        level: 3,
        text: "Add `AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'active')` to exclude users with active subscriptions.",
      },
    ],
    variation: {
      description: `**Modified:** Instead of finding users who have orders but no active subscription, find users who have orders but have **never** subscribed at all (no subscriptions record, regardless of status).

Write a query using \`EXISTS\` or \`NOT EXISTS\` (or LEFT JOIN) to find these users.`,
      starterSql: `-- Users with orders but no subscription record
SELECT DISTINCT u.name, u.email
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.user_id = u.id
)`,
      expectedSql: `SELECT DISTINCT u.name, u.email FROM users u INNER JOIN orders o ON o.user_id = u.id WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id)`,
    },
    tags: ["subquery", "exists", "not-exists", "correlated"],
  },
  {
    id: "p2-in-vs-join",
    phase: "phase-2",
    order: 5,
    title: "Analytics Product Buyers",
    concept: "IN vs JOIN",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Find the distinct names of users who have purchased any product in the 'analytics' category (via completed orders). Sort by name.

Solve this using a subquery with **IN**. (A JOIN would also work — after solving, think about which approach you prefer and why.)`,
    starterSql: `-- Write your query here using IN with a subquery\n`,
    expectedSql: `SELECT DISTINCT u.name
FROM users u
WHERE u.id IN (
  SELECT o.user_id
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  INNER JOIN products p ON p.id = oi.product_id
  WHERE o.status = 'completed'
    AND p.category = 'analytics'
)
ORDER BY u.name`,
    explanation:
      "IN with a subquery is often more readable than a multi-table JOIN when you just need to check membership. The optimizer usually converts them to the same plan.",
    hints: [
      {
        level: 1,
        text: "The subquery should return user_ids of people who bought analytics products. Use JOINs inside the subquery to connect orders -> order_items -> products.",
      },
      {
        level: 2,
        text: "Inner subquery: `SELECT o.user_id FROM orders o INNER JOIN order_items oi ON oi.order_id = o.id INNER JOIN products p ON p.id = oi.product_id WHERE o.status = 'completed' AND p.category = 'analytics'`",
      },
      {
        level: 3,
        text: "Wrap it: `WHERE u.id IN (SELECT o.user_id FROM orders o INNER JOIN order_items oi ON oi.order_id = o.id INNER JOIN products p ON p.id = oi.product_id WHERE o.status = 'completed' AND p.category = 'analytics')`",
      },
    ],
    tags: ["subquery", "in", "join-comparison"],
  },
  {
    id: "p2-any-all",
    phase: "phase-2",
    order: 6,
    title: "ANY and ALL Operators",
    concept: "ANY / ALL",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: ANY and ALL

**ANY** and **ALL** compare a value against a set of values returned by a subquery.

| Operator | Meaning |
|----------|---------|
| \`> ANY(...)\` | greater than at least one value in the list |
| \`> ALL(...)\` | greater than every value in the list |
| \`= ANY(...)\` | equivalent to IN |
| \`!= ALL(...)\` | equivalent to NOT IN |

**Business question 1 (ANY):** Find completed orders whose total is greater than at least one order placed by user id 1.

\`\`\`sql
SELECT id, total_cents / 100.0 AS total_dollars, status
FROM orders
WHERE status = 'completed'
  AND total_cents > ANY (
    SELECT total_cents FROM orders WHERE user_id = 1
  )
ORDER BY total_cents DESC;
\`\`\`

**Business question 2 (ALL):** Find completed orders whose total is greater than ALL orders placed by user id 1 (i.e., bigger than their biggest order).

\`\`\`sql
SELECT id, total_cents / 100.0 AS total_dollars
FROM orders
WHERE status = 'completed'
  AND total_cents > ALL (
    SELECT total_cents FROM orders WHERE user_id = 1
  )
ORDER BY total_cents DESC;
\`\`\`

**Run both queries** and compare the result counts.`,
    starterSql: `-- ANY: orders bigger than at least one of user 1's orders
SELECT id, total_cents / 100.0 AS total_dollars, status
FROM orders
WHERE status = 'completed'
  AND total_cents > ANY (
    SELECT total_cents FROM orders WHERE user_id = 1
  )
ORDER BY total_cents DESC;`,
    expectedSql: `SELECT id, total_cents / 100.0 AS total_dollars, status
FROM orders
WHERE status = 'completed'
  AND total_cents > ANY (
    SELECT total_cents FROM orders WHERE user_id = 1
  )
ORDER BY total_cents DESC`,
    explanation:
      "> ANY is satisfied if the value is greater than at least one result from the subquery. > ALL requires the value to be greater than every result. ANY is equivalent to EXISTS with a comparison; ALL is equivalent to NOT EXISTS with the inverse comparison.",
    hints: [],
    tags: ["subquery", "any", "all", "comparison"],
    skipValidation: true,
  },
  {
    id: "p2-lateral",
    phase: "phase-2",
    order: 7,
    title: "LATERAL — Top N Per Group",
    concept: "LATERAL Subquery",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: LATERAL Subquery (Top-N Per Group)

A **LATERAL** subquery can reference columns from tables listed earlier in the FROM clause — like a correlated subquery but in FROM instead of WHERE.

This makes it perfect for "top N per group" problems.

**Business question:** For each user who has placed orders, show their 2 most recent completed orders (order id, total in dollars, date).

\`\`\`sql
SELECT
  u.name,
  recent.order_id,
  recent.total_dollars,
  recent.created_at
FROM users u
CROSS JOIN LATERAL (
  SELECT
    o.id AS order_id,
    o.total_cents / 100.0 AS total_dollars,
    o.created_at
  FROM orders o
  WHERE o.user_id = u.id          -- references outer u.id
    AND o.status = 'completed'
  ORDER BY o.created_at DESC
  LIMIT 2
) AS recent
ORDER BY u.name, recent.created_at DESC;
\`\`\`

**Key insight:** The \`LATERAL\` subquery runs once per user row, and can reference \`u.id\` from the outer query. \`CROSS JOIN LATERAL\` drops users who have no matching orders (acts like INNER JOIN).

**Run it** to see the top 2 most recent completed orders per user.`,
    starterSql: `SELECT
  u.name,
  recent.order_id,
  recent.total_dollars,
  recent.created_at
FROM users u
CROSS JOIN LATERAL (
  SELECT
    o.id AS order_id,
    o.total_cents / 100.0 AS total_dollars,
    o.created_at
  FROM orders o
  WHERE o.user_id = u.id
    AND o.status = 'completed'
  ORDER BY o.created_at DESC
  LIMIT 2
) AS recent
ORDER BY u.name, recent.created_at DESC;`,
    expectedSql: `SELECT
  u.name,
  recent.order_id,
  recent.total_dollars,
  recent.created_at
FROM users u
CROSS JOIN LATERAL (
  SELECT
    o.id AS order_id,
    o.total_cents / 100.0 AS total_dollars,
    o.created_at
  FROM orders o
  WHERE o.user_id = u.id
    AND o.status = 'completed'
  ORDER BY o.created_at DESC
  LIMIT 2
) AS recent
ORDER BY u.name, recent.created_at DESC`,
    explanation:
      "LATERAL lets a subquery in FROM reference prior FROM tables. CROSS JOIN LATERAL behaves like INNER JOIN (drops unmatched rows). LEFT JOIN LATERAL would keep all users. This is the most efficient way to get top-N per group in PostgreSQL.",
    hints: [],
    tags: ["subquery", "lateral", "top-n", "advanced"],
    skipValidation: true,
  },
  {
    id: "p2-not-in-null-trap",
    phase: "phase-2",
    order: 8,
    title: "The NOT IN / NULL Trap",
    concept: "NOT IN vs NOT EXISTS",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Find users who have never had a subscription. Return their name, email, and plan. Sort by name.

**The trap:** If you use \`NOT IN\` with a subquery that can return NULL, you get zero results — always. This is a classic SQL gotcha.

\`\`\`sql
-- This returns ZERO rows if any subscription has user_id = NULL:
WHERE u.id NOT IN (SELECT user_id FROM subscriptions)
\`\`\`

**Why?** In SQL, \`x NOT IN (1, 2, NULL)\` evaluates to NULL (unknown), not TRUE. So every row is excluded.

**Two safe alternatives:**
1. \`NOT EXISTS\` — explicitly handles NULLs correctly
2. \`NOT IN\` with \`WHERE user_id IS NOT NULL\` added to the subquery

Write the query using **NOT EXISTS** (the idiomatic PostgreSQL approach).`,
    starterSql: `-- Use NOT EXISTS to safely find users with no subscriptions\n`,
    expectedSql: `SELECT
  u.name,
  u.email,
  u.plan
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
ORDER BY u.name`,
    explanation:
      "NOT EXISTS is NULL-safe and usually preferred over NOT IN when checking absence. NOT EXISTS returns true only if the subquery returns zero rows, regardless of NULL values in the data.",
    hints: [
      {
        level: 1,
        text: "Use NOT EXISTS with a correlated subquery that checks if the user has any row in the subscriptions table.",
      },
      {
        level: 2,
        text: "`WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id)` — SELECT 1 is a convention meaning 'just check if a row exists'.",
      },
      {
        level: 3,
        text: "`SELECT u.name, u.email, u.plan FROM users u WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id) ORDER BY u.name`",
      },
    ],
    tags: ["subquery", "not-exists", "null-trap", "anti-join", "advanced"],
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p2-quiz-correlated-vs-uncorrelated",
    phase: "phase-2",
    order: 9,
    title: "Quiz: Correlated Subquery",
    concept: "Subqueries",
    mode: "quiz",
    difficulty: "intermediate",
    description: `A **correlated subquery** is one that references a column from the outer query. Which of the following is a correlated subquery?`,
    expectedSql: "",
    explanation: `A correlated subquery uses a value from the outer query (here \`u.id\`) inside the subquery. It runs once per row in the outer query. Uncorrelated subqueries run independently and are usually faster.`,
    hints: [],
    tags: ["subquery", "correlated", "subqueries"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "SELECT name FROM users u WHERE (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) > 2",
        isCorrect: true,
      },
      {
        id: "b",
        text: "SELECT name FROM users WHERE id IN (SELECT user_id FROM orders)",
        isCorrect: false,
      },
      {
        id: "c",
        text: "SELECT * FROM (SELECT user_id, COUNT(*) FROM orders GROUP BY user_id) AS counts",
        isCorrect: false,
      },
      {
        id: "d",
        text: "SELECT AVG(total_cents) FROM orders",
        isCorrect: false,
      },
    ],
  },
  {
    id: "p2-quiz-exists-vs-in",
    phase: "phase-2",
    order: 10,
    title: "Quiz: EXISTS vs IN",
    concept: "EXISTS",
    mode: "quiz",
    difficulty: "intermediate",
    description: `Which statement about \`EXISTS\` vs \`IN\` is most accurate for large datasets?`,
    expectedSql: "",
    explanation: `\`EXISTS\` stops as soon as it finds the first matching row (short-circuit evaluation), while \`IN\` must fully evaluate the subquery and load all results. For large result sets, \`EXISTS\` is typically faster. However, \`IN\` can be faster for small subquery results.`,
    hints: [],
    tags: ["subquery", "exists", "subqueries"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "EXISTS is often faster because it stops at the first match (short-circuit)",
        isCorrect: true,
      },
      {
        id: "b",
        text: "IN is always faster than EXISTS",
        isCorrect: false,
      },
      {
        id: "c",
        text: "EXISTS and IN always produce the same query plan",
        isCorrect: false,
      },
      {
        id: "d",
        text: "EXISTS requires an index; IN does not",
        isCorrect: false,
      },
    ],
  },
];

export const phase2Exercises: readonly Exercise[] = [...phase2BaseExercises, ...phase2DebugExercises];
