import type { Exercise } from "@/lib/exercises/types";
import { phase1DebugExercises } from "./debug";

const phase1BaseExercises: readonly Exercise[] = [
  {
    id: "p1-inner-join-worked",
    phase: "phase-1",
    order: 1,
    title: "How INNER JOIN Works",
    concept: "INNER JOIN",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Joining Users to Their Orders

An **INNER JOIN** returns only rows where the join condition matches in **both** tables. Rows with no match in either table are excluded.

**Business question:** Show all completed orders with the buyer's name and email.

\`\`\`sql
SELECT
  u.name,
  u.email,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  o.created_at
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;
\`\`\`

**What each part does:**
- \`FROM orders o\` — start with the orders table, aliased as \`o\`
- \`INNER JOIN users u ON u.id = o.user_id\` — attach the matching user row
- \`WHERE o.status = 'completed'\` — filter after joining
- Only orders that have a matching user are returned

**Run the query** to see the results, then move to the next exercise.`,
    starterSql: `SELECT
  u.name,
  u.email,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  o.created_at
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;`,
    expectedSql: `SELECT
  u.name,
  u.email,
  o.id AS order_id,
  o.total_cents / 100.0 AS total_dollars,
  o.created_at
FROM orders o
INNER JOIN users u ON u.id = o.user_id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC`,
    explanation:
      "INNER JOIN is the most common join type. It returns the intersection — only rows that have matches on both sides of the join.",
    hints: [],
    tags: ["join", "inner-join", "basics"],
    skipValidation: true,
  },
  {
    id: "p1-inner-join-agg",
    phase: "phase-1",
    order: 2,
    title: "Count Orders Per User",
    concept: "INNER JOIN + GROUP BY",
    mode: "scaffolded",
    difficulty: "beginner",
    description: `**Business question:** How many completed orders has each user placed? Show their name, email, and order count. Only include users who have at least one completed order. Sort by order count descending.

Fill in the blanks to complete the query.`,
    starterSql: `SELECT
  ____ AS name,
  u.email,
  COUNT(____) AS order_count
FROM ____ u
____ orders o ON ____
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC;`,
    expectedSql: `SELECT
  u.name AS name,
  u.email,
  COUNT(o.id) AS order_count
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC`,
    explanation:
      "When joining and aggregating, GROUP BY must include all non-aggregated columns from SELECT. The INNER JOIN already filters out users with no orders.",
    hints: [
      {
        level: 1,
        text: "GROUP BY needs every column in SELECT that is not inside an aggregate function like COUNT().",
      },
      {
        level: 2,
        text: "Start with `FROM users u INNER JOIN orders o ON o.user_id = u.id`. The join condition connects orders to their users via the foreign key.",
      },
      {
        level: 3,
        text: "`u.name` fills the first blank. `o.id` fills the COUNT blank. The FROM/JOIN reads: `FROM users u INNER JOIN orders o ON o.user_id = u.id`.",
      },
    ],
    tags: ["join", "inner-join", "aggregation", "group-by", "count"],
  },
  {
    id: "p1-left-join-open",
    phase: "phase-1",
    order: 3,
    title: "Find Users With No Orders",
    concept: "LEFT JOIN + IS NULL",
    mode: "open",
    difficulty: "beginner",
    description: `**Business question:** Which users have never placed an order? Return their name, email, and plan. Sort alphabetically by name.

A **LEFT JOIN** keeps all rows from the left table, even when there is no match on the right. Unmatched rows have NULL in all right-table columns.`,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  u.name,
  u.email,
  u.plan
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL
ORDER BY u.name`,
    explanation:
      "The classic 'anti-join' pattern: LEFT JOIN + WHERE right_table.id IS NULL. This finds rows that have no match on the right side. An alternative is NOT EXISTS.",
    hints: [
      {
        level: 1,
        text: "Use a LEFT JOIN to keep all users, even those with no orders. After joining, rows with no matching order will have NULL values in the orders columns.",
      },
      {
        level: 2,
        text: "After your LEFT JOIN, add a WHERE clause that filters for rows where a column from the orders table IS NULL.",
      },
      {
        level: 3,
        text: "`FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE o.id IS NULL` — check IS NULL on the orders primary key.",
      },
    ],
    variation: {
      description: `**Modified:** Find users who have **no subscriptions** (not just no orders).

Write a query that returns the name and email of users who have never subscribed to any product. Use a LEFT JOIN with the \`subscriptions\` table and filter for unmatched rows.`,
      starterSql: `-- Find users with no subscriptions
SELECT u.name, u.email
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE `,
      expectedSql: `SELECT u.name, u.email FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id WHERE s.id IS NULL`,
    },
    tags: ["join", "left-join", "anti-join", "null"],
  },
  {
    id: "p1-self-join-open",
    phase: "phase-1",
    order: 4,
    title: "Users Who Signed Up the Same Day",
    concept: "Self JOIN",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Find pairs of users who signed up on the same calendar day. Return both users' names and their signup date. Avoid duplicate pairs (Alice+Bob and Bob+Alice should appear once). Sort by signup date, then by the first user's name.`,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  u1.name AS user1_name,
  u2.name AS user2_name,
  u1.created_at::date AS signup_date
FROM users u1
INNER JOIN users u2 ON u1.created_at::date = u2.created_at::date
  AND u1.id < u2.id
ORDER BY signup_date, u1.name`,
    explanation:
      "A self-join joins a table to itself using two different aliases. The `u1.id < u2.id` condition prevents duplicates (A-B and B-A) and self-pairs (A-A).",
    hints: [
      {
        level: 1,
        text: "A self-join uses the same table twice with different aliases: `FROM users u1 INNER JOIN users u2 ON ...`.",
      },
      {
        level: 2,
        text: "Cast timestamps to dates for comparison: `u1.created_at::date = u2.created_at::date`. Add a second condition to prevent duplicate pairs.",
      },
      {
        level: 3,
        text: "Use `AND u1.id < u2.id` as a second join condition. This ensures each pair appears exactly once.",
      },
    ],
    tags: ["join", "self-join", "date-functions"],
  },
  {
    id: "p1-multi-join-open",
    phase: "phase-1",
    order: 5,
    title: "Order Line Items With Product Details",
    concept: "Multiple JOINs",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Show each order line item with: the buyer's name, the product name, product category, quantity purchased, and line item total (quantity x unit price in dollars). Only include completed orders. Sort by order ID, then product name.`,
    starterSql: `-- You will need to join: orders, order_items, users, products\n`,
    expectedSql: `SELECT
  u.name AS buyer_name,
  p.name AS product_name,
  p.category,
  oi.quantity,
  (oi.quantity * oi.unit_price_cents) / 100.0 AS line_total_dollars
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN users u ON u.id = o.user_id
INNER JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
ORDER BY o.id, p.name`,
    explanation:
      "Chain multiple INNER JOINs to traverse a join graph. Start with the central table (orders), then attach related tables one by one.",
    hints: [
      {
        level: 1,
        text: "You need 3 joins: orders\u2192order_items, orders\u2192users, order_items\u2192products. Start with orders as your base table.",
      },
      {
        level: 2,
        text: "Chain: `FROM orders o INNER JOIN order_items oi ON oi.order_id = o.id INNER JOIN users u ON u.id = o.user_id INNER JOIN products p ON p.id = oi.product_id`",
      },
      {
        level: 3,
        text: "Line total = `(oi.quantity * oi.unit_price_cents) / 100.0 AS line_total_dollars`. Add `WHERE o.status = 'completed'` before ORDER BY.",
      },
    ],
    tags: ["join", "multiple-joins", "arithmetic"],
  },
  {
    id: "p1-full-outer-join",
    phase: "phase-1",
    order: 6,
    title: "FULL OUTER JOIN — All Rows From Both Sides",
    concept: "FULL OUTER JOIN",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: FULL OUTER JOIN

A **FULL OUTER JOIN** keeps all rows from **both** tables, filling in NULLs where there is no match.

| Join Type | Keeps |
|-----------|-------|
| INNER JOIN | only matched rows |
| LEFT JOIN | all left + matched right |
| RIGHT JOIN | matched left + all right |
| FULL OUTER JOIN | all rows from both sides |

**Business question:** Show all users and all orders side by side, even if a user has no orders or (hypothetically) an order has no matching user. Flag whether the user has an order.

\`\`\`sql
SELECT
  u.name AS user_name,
  u.plan,
  o.id AS order_id,
  o.status,
  CASE
    WHEN o.id IS NULL THEN 'No orders'
    ELSE 'Has order'
  END AS order_status
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id
ORDER BY u.name NULLS LAST, o.id;
\`\`\`

**CASE WHEN** is SQL's if/else — useful for labeling NULL situations.

**Run it** and notice rows where \`order_id\` is NULL (users with no orders) and any rows where \`user_name\` is NULL (orders with no user — may be none in this dataset).`,
    starterSql: `SELECT
  u.name AS user_name,
  u.plan,
  o.id AS order_id,
  o.status,
  CASE
    WHEN o.id IS NULL THEN 'No orders'
    ELSE 'Has order'
  END AS order_status
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id
ORDER BY u.name NULLS LAST, o.id;`,
    expectedSql: `SELECT
  u.name AS user_name,
  u.plan,
  o.id AS order_id,
  o.status,
  CASE
    WHEN o.id IS NULL THEN 'No orders'
    ELSE 'Has order'
  END AS order_status
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id
ORDER BY u.name NULLS LAST, o.id`,
    explanation:
      "FULL OUTER JOIN is the union of LEFT and RIGHT joins. It's useful for auditing and finding mismatches in both directions. CASE WHEN is SQL's conditional expression.",
    hints: [],
    tags: ["join", "full-outer-join", "case-when", "null"],
    skipValidation: true,
  },
  {
    id: "p1-cross-join",
    phase: "phase-1",
    order: 7,
    title: "CROSS JOIN — All Combinations",
    concept: "CROSS JOIN",
    mode: "open",
    difficulty: "intermediate",
    description: `**Business question:** Generate a pricing matrix showing every combination of product and subscription plan (free, starter, pro, enterprise). Show the product name, plan name, and a hypothetical "discounted price" where free plan pays full price, starter gets 10% off, pro gets 20% off, and enterprise gets 30% off.

A **CROSS JOIN** produces the **Cartesian product** — every row from the left table paired with every row from the right table. No join condition is needed.

\`\`\`sql
-- If table A has 3 rows and B has 4 rows:
SELECT * FROM A CROSS JOIN B;
-- Result: 3 × 4 = 12 rows
\`\`\`

For this exercise, use a **VALUES** clause to create the plan list inline:
\`\`\`sql
-- Inline table of plan names:
(VALUES ('free'), ('starter'), ('pro'), ('enterprise')) AS plans(plan_name)
\`\`\``,
    starterSql: `-- Cross join products with an inline table of plan names\n`,
    expectedSql: `SELECT
  p.name AS product_name,
  plans.plan_name,
  p.price_cents / 100.0 AS full_price,
  ROUND(p.price_cents / 100.0 * CASE plans.plan_name
    WHEN 'free'       THEN 1.00
    WHEN 'starter'    THEN 0.90
    WHEN 'pro'        THEN 0.80
    WHEN 'enterprise' THEN 0.70
  END, 2) AS discounted_price
FROM products p
CROSS JOIN (VALUES ('free'), ('starter'), ('pro'), ('enterprise')) AS plans(plan_name)
ORDER BY p.name, plans.plan_name`,
    explanation:
      "CROSS JOIN creates every possible combination. It's used for generating matrices, test data, and pairing every option with every other option. VALUES creates an inline table without needing a real table.",
    hints: [
      {
        level: 1,
        text: "Use `FROM products p CROSS JOIN (VALUES ('free'), ('starter'), ('pro'), ('enterprise')) AS plans(plan_name)`. This gives every product × plan combination.",
      },
      {
        level: 2,
        text: "Use CASE plans.plan_name WHEN 'free' THEN 1.00 WHEN 'starter' THEN 0.90 WHEN 'pro' THEN 0.80 WHEN 'enterprise' THEN 0.70 END to compute the discount multiplier.",
      },
      {
        level: 3,
        text: "Multiply price_cents by the CASE result for the discount, divide by 100 for dollars, and wrap in ROUND(..., 2). Full CROSS JOIN: `FROM products p CROSS JOIN (VALUES ('free'), ('starter'), ('pro'), ('enterprise')) AS plans(plan_name)`",
      },
    ],
    tags: ["join", "cross-join", "case-when", "arithmetic"],
  },
  {
    id: "p1-non-equi-join",
    phase: "phase-1",
    order: 8,
    title: "Range (Non-Equi) JOIN",
    concept: "Non-Equi JOIN",
    mode: "open",
    difficulty: "advanced",
    description: `**Business question:** Assign a pricing tier label to each completed order based on its total value:

| Tier | Range |
|------|-------|
| \`small\` | under $25 |
| \`medium\` | $25–$99.99 |
| \`large\` | $100–$499.99 |
| \`enterprise\` | $500+ |

Return: order id, user name, total in dollars, and tier. Sort by total descending.

**The trick:** Use a **range join** — join orders to an inline tier table using \`BETWEEN\` (or \`>=\` and \`<\`) instead of \`=\`.

\`\`\`sql
-- Inline tier definitions using VALUES:
(VALUES
  ('small',      0,     2499),
  ('medium',  2500,     9999),
  ('large',  10000,    49999),
  ('enterprise', 50000, 999999999)
) AS tiers(tier_name, min_cents, max_cents)
\`\`\`

Join using: \`ON o.total_cents BETWEEN tiers.min_cents AND tiers.max_cents\``,
    starterSql: `-- Join orders to inline tier definitions using a range condition\n`,
    expectedSql: `SELECT
  o.id AS order_id,
  u.name AS user_name,
  o.total_cents / 100.0 AS total_dollars,
  tiers.tier_name
FROM orders o
INNER JOIN users u ON u.id = o.user_id
INNER JOIN (VALUES
  ('small',         0,     2499),
  ('medium',     2500,     9999),
  ('large',     10000,    49999),
  ('enterprise',50000, 999999999)
) AS tiers(tier_name, min_cents, max_cents)
  ON o.total_cents BETWEEN tiers.min_cents AND tiers.max_cents
WHERE o.status = 'completed'
ORDER BY o.total_cents DESC`,
    explanation:
      "A non-equi join uses inequality operators (BETWEEN, >=, <) instead of equality. It's powerful for lookups against ranges like price bands, date intervals, or score brackets. The VALUES clause creates an inline reference table without needing a real table.",
    hints: [
      {
        level: 1,
        text: "Create the tier definitions with VALUES, then join orders to them using BETWEEN. Also join users to get the user name.",
      },
      {
        level: 2,
        text: "The join condition: `ON o.total_cents BETWEEN tiers.min_cents AND tiers.max_cents`. Make sure your tier ranges are in cents (multiply dollar thresholds by 100).",
      },
      {
        level: 3,
        text: "Chain three joins: `FROM orders o INNER JOIN users u ON u.id = o.user_id INNER JOIN (VALUES ('small',0,2499),('medium',2500,9999),('large',10000,49999),('enterprise',50000,999999999)) AS tiers(tier_name,min_cents,max_cents) ON o.total_cents BETWEEN tiers.min_cents AND tiers.max_cents`",
      },
    ],
    tags: ["join", "non-equi-join", "between", "range", "advanced"],
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p1-quiz-inner-vs-left",
    phase: "phase-1",
    order: 9,
    title: "Quiz: INNER JOIN vs LEFT JOIN",
    concept: "JOIN Types",
    mode: "quiz",
    difficulty: "beginner",
    description: `You want to see ALL users, including those who have **never placed an order**. Which JOIN type should you use?`,
    expectedSql: "",
    explanation: `**LEFT JOIN** keeps all rows from the left table (users), filling right-side columns with NULL when there's no match. **INNER JOIN** would exclude users with no orders because it only returns rows that match on both sides.`,
    hints: [],
    tags: ["join", "left-join", "inner-join"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "LEFT JOIN", isCorrect: true },
      { id: "b", text: "INNER JOIN", isCorrect: false },
      { id: "c", text: "FULL OUTER JOIN", isCorrect: false },
      { id: "d", text: "CROSS JOIN", isCorrect: false },
    ],
  },
  {
    id: "p1-quiz-join-on",
    phase: "phase-1",
    order: 10,
    title: "Quiz: JOIN Condition",
    concept: "INNER JOIN",
    mode: "quiz",
    difficulty: "beginner",
    description: `The \`orders\` table has a \`user_id\` column that references \`users.id\`. What is the correct JOIN condition to link these two tables?`,
    expectedSql: "",
    explanation: `The JOIN condition \`ON orders.user_id = users.id\` links each order to its owner. The foreign key (\`orders.user_id\`) on the child table matches the primary key (\`users.id\`) on the parent table.`,
    hints: [],
    tags: ["join", "inner-join", "foreign-key"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "ON orders.user_id = users.id", isCorrect: true },
      { id: "b", text: "ON users.id = orders.id", isCorrect: false },
      { id: "c", text: "WHERE orders.user_id = users.id", isCorrect: false },
      { id: "d", text: "ON users.user_id = orders.user_id", isCorrect: false },
    ],
  },
];

export const phase1Exercises: readonly Exercise[] = [...phase1BaseExercises, ...phase1DebugExercises];
