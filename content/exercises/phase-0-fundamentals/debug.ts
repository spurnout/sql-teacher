import type { Exercise } from "@/lib/exercises/types";

export const phase0DebugExercises: readonly Exercise[] = [
  {
    id: "p0-debug-where-wrong-op",
    phase: "phase-0",
    order: 12,
    title: "Bug Fix: Wrong Comparison Operator",
    concept: "WHERE Clause",
    mode: "debug",
    difficulty: "beginner",
    description: `## Debug & Fix

A colleague wrote this query to find all users on the **'pro'** plan, but it's returning the wrong results.

**Expected:** All users whose plan is exactly \`'pro'\`.

**Run the buggy query**, examine the output, and **fix** the bug.`,
    starterSql: `SELECT name, email, plan
FROM users
WHERE plan != 'pro'
ORDER BY name;`,
    expectedSql: `SELECT name, email, plan
FROM users
WHERE plan = 'pro'
ORDER BY name`,
    explanation:
      "The WHERE clause used `!=` (not equal) instead of `=` (equal). This returned everyone who is NOT on the pro plan — the exact opposite of what was needed.",
    bugDescription:
      "The comparison operator was `!=` (not equal) instead of `=` (equal). This is a classic off-by-one-logic bug — the filter selected everyone EXCEPT pro users.",
    hints: [
      { level: 1, text: "Look carefully at the comparison operator in the WHERE clause. Is it selecting or excluding?" },
      { level: 2, text: "The operator `!=` means 'not equal to'. What operator means 'equal to'?" },
      { level: 3, text: "Change `!=` to `=` in the WHERE clause." },
    ],
    tags: ["where", "comparison", "debug"],
  },
  {
    id: "p0-debug-missing-order-by",
    phase: "phase-0",
    order: 13,
    title: "Bug Fix: Missing Sort Order",
    concept: "ORDER BY",
    mode: "debug",
    difficulty: "beginner",
    description: `## Debug & Fix

This query should list all products sorted from **most expensive to least expensive**, but the results come out in the wrong order.

**Expected:** Products ordered by \`price_cents\` descending (highest first).

**Run the buggy query**, compare the output order, and **fix** the bug.`,
    starterSql: `SELECT name, category, price_cents / 100.0 AS price_dollars
FROM products
ORDER BY price_cents ASC;`,
    expectedSql: `SELECT name, category, price_cents / 100.0 AS price_dollars
FROM products
ORDER BY price_cents DESC`,
    explanation:
      "ORDER BY defaults to ASC (ascending) when no direction is specified. To sort from highest to lowest, you need DESC (descending).",
    bugDescription:
      "The query used `ASC` (ascending) instead of `DESC` (descending). Since the requirement was 'most expensive first', the sort direction needed to be reversed.",
    hints: [
      { level: 1, text: "The results are sorted, but in which direction? Is that what we want?" },
      { level: 2, text: "ASC means ascending (low to high). What keyword means descending (high to low)?" },
      { level: 3, text: "Change `ASC` to `DESC` in the ORDER BY clause." },
    ],
    tags: ["order-by", "sort", "debug"],
  },
  {
    id: "p0-debug-bad-aggregate",
    phase: "phase-0",
    order: 14,
    title: "Bug Fix: Wrong Aggregate Function",
    concept: "Aggregate Functions",
    mode: "debug",
    difficulty: "beginner",
    description: `## Debug & Fix

This query is supposed to find the **total number of orders** per status, but it's showing dollar amounts instead of counts.

**Expected:** A count of how many orders exist for each status.

**Run the buggy query**, notice the unexpected numbers, and **fix** the bug.`,
    starterSql: `SELECT status, SUM(total_cents) AS order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC;`,
    expectedSql: `SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC`,
    explanation:
      "SUM(total_cents) adds up the dollar amounts, while COUNT(*) counts the number of rows. When you need 'how many', use COUNT; when you need 'how much', use SUM.",
    bugDescription:
      "The query used `SUM(total_cents)` instead of `COUNT(*)`. SUM adds up values (giving total revenue per status), while COUNT counts rows (giving the number of orders per status).",
    hints: [
      { level: 1, text: "Look at what the aggregate function is computing. Is it counting rows or adding values?" },
      { level: 2, text: "SUM adds up column values. Which aggregate function counts the number of rows?" },
      { level: 3, text: "Replace `SUM(total_cents)` with `COUNT(*)` to count orders instead of summing amounts." },
    ],
    tags: ["aggregate", "count", "sum", "debug"],
  },
];
