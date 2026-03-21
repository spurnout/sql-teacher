import type { Exercise } from "@/lib/exercises/types";

export const phase1DebugExercises: readonly Exercise[] = [
  {
    id: "p1-debug-wrong-join-type",
    phase: "phase-1",
    order: 11,
    title: "Bug Fix: Wrong JOIN Type",
    concept: "LEFT JOIN vs INNER JOIN",
    mode: "debug",
    difficulty: "beginner",
    description: `## Debug & Fix

This query should list **all users** with their order count — including users who have **never placed an order** (they should show \`0\`).

But some users are missing from the results!

**Expected:** Every user appears, with \`order_count\` showing 0 if they have no orders.

**Run the buggy query**, notice the missing users, and **fix** the bug.`,
    starterSql: `SELECT u.name, u.email, COUNT(o.id) AS order_count
FROM users u
INNER JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC;`,
    expectedSql: `SELECT u.name, u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC`,
    explanation:
      "INNER JOIN only returns rows where there's a match in both tables. Users with no orders have no matching row in the orders table, so they're excluded. LEFT JOIN keeps all rows from the left table (users), filling NULLs for unmatched right-side columns.",
    bugDescription:
      "The query used `INNER JOIN` instead of `LEFT JOIN`. INNER JOIN excludes users without orders because there's no matching row in the orders table. LEFT JOIN preserves all users and returns NULL for the orders columns when no match exists, which COUNT(o.id) correctly counts as 0.",
    hints: [
      { level: 1, text: "Think about which users are missing. What do they have in common?" },
      { level: 2, text: "INNER JOIN only returns rows where both sides match. Which JOIN type keeps ALL rows from the left table?" },
      { level: 3, text: "Change `INNER JOIN` to `LEFT JOIN` to include users with no orders." },
    ],
    tags: ["join", "left-join", "inner-join", "debug"],
  },
  {
    id: "p1-debug-missing-on-clause",
    phase: "phase-1",
    order: 12,
    title: "Bug Fix: Wrong JOIN Condition",
    concept: "JOIN ON Clause",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should show each order with the **product name** from its line items, but it's producing a massive result set with obviously wrong combinations.

**Expected:** Each order item matched to its correct product.

**Run the buggy query**, notice the inflated row count, and **fix** the bug.`,
    starterSql: `SELECT o.id AS order_id, oi.quantity, p.name AS product_name, oi.unit_price_cents / 100.0 AS unit_price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = o.id
ORDER BY o.id, p.name;`,
    expectedSql: `SELECT o.id AS order_id, oi.quantity, p.name AS product_name, oi.unit_price_cents / 100.0 AS unit_price
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
ORDER BY o.id, p.name`,
    explanation:
      "The second JOIN was matching products to orders by their IDs (`p.id = o.id`), which is semantically wrong — a product's ID has nothing to do with an order's ID. The correct join links products to order_items via `p.id = oi.product_id`.",
    bugDescription:
      "The JOIN condition `p.id = o.id` joined products to orders by raw ID values, creating incorrect matches. The correct condition is `p.id = oi.product_id`, which links each order item to its actual product.",
    hints: [
      { level: 1, text: "Look at both JOIN conditions. Which table should products be linked to — orders or order_items?" },
      { level: 2, text: "Products relate to order_items via `product_id`, not directly to orders. Check the second ON clause." },
      { level: 3, text: "Change `p.id = o.id` to `p.id = oi.product_id` in the second JOIN." },
    ],
    tags: ["join", "on-clause", "foreign-key", "debug"],
  },
  {
    id: "p1-debug-ambiguous-column",
    phase: "phase-1",
    order: 13,
    title: "Bug Fix: Ambiguous Column Reference",
    concept: "Table Aliases",
    mode: "debug",
    difficulty: "beginner",
    description: `## Debug & Fix

This query should list users and their subscription details, but it **errors out** because a column name is ambiguous.

**Expected:** A working query showing user name, product name, subscription status, and start date.

**Run the buggy query**, read the error, and **fix** the ambiguous reference.`,
    starterSql: `SELECT u.name AS user_name, name AS product_name, s.status, s.started_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
JOIN products p ON p.id = s.product_id
ORDER BY s.started_at DESC;`,
    expectedSql: `SELECT u.name AS user_name, p.name AS product_name, s.status, s.started_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
JOIN products p ON p.id = s.product_id
ORDER BY s.started_at DESC`,
    explanation:
      "Both the `users` and `products` tables have a `name` column. When you join them, the database doesn't know which `name` you mean. Prefixing with the table alias (`p.name`) resolves the ambiguity.",
    bugDescription:
      "The column `name` in the SELECT list was ambiguous — both `users` and `products` have a `name` column. Without a table alias prefix, PostgreSQL raises an error. The fix is `p.name` to specify the products table.",
    hints: [
      { level: 1, text: "Read the error message. Which column is ambiguous? Which tables share that column name?" },
      { level: 2, text: "The `name` column exists in both `users` and `products`. You need to specify which table using an alias." },
      { level: 3, text: "Change `name AS product_name` to `p.name AS product_name`." },
    ],
    tags: ["join", "alias", "ambiguous", "debug"],
  },
  {
    id: "p1-debug-missing-group-by",
    phase: "phase-1",
    order: 14,
    title: "Bug Fix: Missing GROUP BY Column",
    concept: "GROUP BY with JOIN",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should show each user's name and their **total spending** across all completed orders. But it errors out with a GROUP BY violation.

**Expected:** Each user's name and total spending, sorted by highest spender first.

**Run the buggy query**, read the error, and **fix** the GROUP BY clause.`,
    starterSql: `SELECT u.name, SUM(o.total_cents) / 100.0 AS total_spent
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id
ORDER BY total_spent DESC;`,
    expectedSql: `SELECT u.name, SUM(o.total_cents) / 100.0 AS total_spent
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.id, u.name
ORDER BY total_spent DESC`,
    explanation:
      "PostgreSQL requires every non-aggregated column in SELECT to appear in GROUP BY. Since `u.name` is selected without an aggregate function, it must be in the GROUP BY clause. Grouping by `u.id` alone isn't sufficient unless `name` is functionally dependent on `id` (which PostgreSQL doesn't always infer).",
    bugDescription:
      "The GROUP BY clause only included `u.id` but the SELECT list also references `u.name`. PostgreSQL's strict mode requires all non-aggregated columns to appear in GROUP BY. Adding `u.name` to the GROUP BY fixes the error.",
    hints: [
      { level: 1, text: "The error mentions GROUP BY. Which column in SELECT is missing from GROUP BY?" },
      { level: 2, text: "`u.name` is in SELECT but not in GROUP BY. Non-aggregated columns must be grouped." },
      { level: 3, text: "Change `GROUP BY u.id` to `GROUP BY u.id, u.name`." },
    ],
    tags: ["group-by", "join", "aggregate", "debug"],
  },
];
