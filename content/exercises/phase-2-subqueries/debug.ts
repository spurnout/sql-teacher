import type { Exercise } from "@/lib/exercises/types";

export const phase2DebugExercises: readonly Exercise[] = [
  {
    id: "p2-debug-correlated-vs-non",
    phase: "phase-2",
    order: 11,
    title: "Bug Fix: Correlated Subquery Missing Correlation",
    concept: "Correlated Subquery",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should find users who have spent **more than the average order total for their own orders**, but it's comparing against the **global** average instead.

**Expected:** Each user compared against their own personal average, not the platform average.

**Run the buggy query**, think about what average is being computed, and **fix** the subquery.`,
    starterSql: `SELECT u.name, o.id AS order_id, o.total_cents / 100.0 AS total_dollars
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.total_cents > (
  SELECT AVG(total_cents)
  FROM orders
  WHERE status = 'completed'
)
ORDER BY u.name, total_dollars DESC;`,
    expectedSql: `SELECT u.name, o.id AS order_id, o.total_cents / 100.0 AS total_dollars
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.total_cents > (
  SELECT AVG(o2.total_cents)
  FROM orders o2
  WHERE o2.user_id = u.id AND o2.status = 'completed'
)
ORDER BY u.name, total_dollars DESC`,
    explanation:
      "The subquery was computing the global average instead of each user's personal average. By adding `WHERE o2.user_id = u.id`, the subquery becomes correlated — it re-evaluates for each user, computing their individual average.",
    bugDescription:
      "The subquery was not correlated to the outer query. It computed `AVG(total_cents)` across ALL orders, not per-user. Adding the correlation condition `WHERE o2.user_id = u.id` makes it compute each user's own average.",
    hints: [
      { level: 1, text: "Is the subquery computing the average for each user, or for everyone?" },
      { level: 2, text: "The subquery needs a WHERE clause linking it to the outer user. Use an alias like `o2` for the inner orders table." },
      { level: 3, text: "Add `WHERE o2.user_id = u.id AND o2.status = 'completed'` to the subquery, aliasing the inner orders table as `o2`." },
    ],
    tags: ["subquery", "correlated", "avg", "debug"],
  },
  {
    id: "p2-debug-in-vs-exists",
    phase: "phase-2",
    order: 12,
    title: "Bug Fix: Subquery Returns Multiple Columns",
    concept: "IN Subquery",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should find all users who have placed **at least one completed order**, using an IN subquery. But it errors out because the subquery returns too many columns.

**Expected:** Users who appear in the completed orders list.

**Run the buggy query**, read the error, and **fix** the subquery.`,
    starterSql: `SELECT name, email, plan
FROM users
WHERE id IN (
  SELECT user_id, total_cents
  FROM orders
  WHERE status = 'completed'
)
ORDER BY name;`,
    expectedSql: `SELECT name, email, plan
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE status = 'completed'
)
ORDER BY name`,
    explanation:
      "An IN subquery must return exactly one column — the column being compared. The extra `total_cents` column caused the error. Remove it so the subquery only returns `user_id`.",
    bugDescription:
      "The IN subquery returned two columns (`user_id, total_cents`) but IN comparisons require exactly one column. The `total_cents` column was unnecessary and caused a syntax error.",
    hints: [
      { level: 1, text: "How many columns can an IN subquery return? How many does this one return?" },
      { level: 2, text: "IN subqueries must return exactly one column. Remove the extra column from the SELECT." },
      { level: 3, text: "Change `SELECT user_id, total_cents` to `SELECT user_id` in the subquery." },
    ],
    tags: ["subquery", "in", "debug"],
  },
  {
    id: "p2-debug-missing-alias",
    phase: "phase-2",
    order: 13,
    title: "Bug Fix: Missing Subquery Alias",
    concept: "Derived Table",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query uses a subquery in the FROM clause (a derived table) to find the top-spending user per plan. But PostgreSQL rejects it with a syntax error about a missing alias.

**Expected:** Each plan with its highest-spending user.

**Run the buggy query**, read the error, and **fix** the missing alias.`,
    starterSql: `SELECT plan, name, total_spent
FROM (
  SELECT u.plan, u.name, SUM(o.total_cents) / 100.0 AS total_spent,
         ROW_NUMBER() OVER (PARTITION BY u.plan ORDER BY SUM(o.total_cents) DESC) AS rn
  FROM users u
  JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.plan, u.name
)
WHERE rn = 1
ORDER BY total_spent DESC;`,
    expectedSql: `SELECT plan, name, total_spent
FROM (
  SELECT u.plan, u.name, SUM(o.total_cents) / 100.0 AS total_spent,
         ROW_NUMBER() OVER (PARTITION BY u.plan ORDER BY SUM(o.total_cents) DESC) AS rn
  FROM users u
  JOIN orders o ON o.user_id = u.id
  WHERE o.status = 'completed'
  GROUP BY u.plan, u.name
) AS ranked
WHERE rn = 1
ORDER BY total_spent DESC`,
    explanation:
      "In PostgreSQL, every subquery used in the FROM clause (a 'derived table') must have an alias. Adding `AS ranked` after the closing parenthesis gives the subquery a name that PostgreSQL requires.",
    bugDescription:
      "PostgreSQL requires all derived tables (subqueries in FROM) to have an alias. The subquery was missing `AS ranked` (or any alias) after its closing parenthesis.",
    hints: [
      { level: 1, text: "The error is about the subquery in FROM. What does PostgreSQL require for derived tables?" },
      { level: 2, text: "Derived tables need an alias. Add `AS something` after the closing `)` of the subquery." },
      { level: 3, text: "Add `AS ranked` after the closing `)` of the subquery, before `WHERE rn = 1`." },
    ],
    tags: ["subquery", "derived-table", "alias", "debug"],
  },
  {
    id: "p2-debug-wrong-subquery-column",
    phase: "phase-2",
    order: 14,
    title: "Bug Fix: Subquery Compares Wrong Column",
    concept: "Scalar Subquery",
    mode: "debug",
    difficulty: "intermediate",
    description: `## Debug & Fix

This query should find products priced **above the average product price**. The query runs but returns incorrect results because the subquery averages the wrong column.

**Expected:** Products whose \`price_cents\` exceeds the average \`price_cents\` across all products.

**Run the buggy query**, check what the subquery is actually averaging, and **fix** it.`,
    starterSql: `SELECT name, category, price_cents / 100.0 AS price_dollars
FROM products
WHERE price_cents > (
  SELECT AVG(id)
  FROM products
)
ORDER BY price_cents DESC;`,
    expectedSql: `SELECT name, category, price_cents / 100.0 AS price_dollars
FROM products
WHERE price_cents > (
  SELECT AVG(price_cents)
  FROM products
)
ORDER BY price_cents DESC`,
    explanation:
      "The subquery was computing `AVG(id)` — the average of product IDs (small integers) — instead of `AVG(price_cents)`. This meant the comparison threshold was a tiny number, making almost all products appear 'above average'.",
    bugDescription:
      "The subquery used `AVG(id)` instead of `AVG(price_cents)`. Since product IDs are small integers (1-8), the average was around 4.5, which is far below any product's price in cents. The fix is to average the correct column.",
    hints: [
      { level: 1, text: "What column is the AVG function operating on? Is that the right column to average?" },
      { level: 2, text: "The subquery averages `id` but we need the average of `price_cents`." },
      { level: 3, text: "Change `AVG(id)` to `AVG(price_cents)` in the subquery." },
    ],
    tags: ["subquery", "scalar", "avg", "debug"],
  },
];
