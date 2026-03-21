import type { ScenarioStep } from "@/lib/scenarios/types";

export const dataQualityAuditSteps: readonly ScenarioStep[] = [
  {
    stepIndex: 0,
    title: "Find NULL Patterns",
    description: `The data team suspects data quality issues. Your first task: **identify columns with missing data**.

Write a query that counts the number of NULL values in key user columns: \`name\`, \`email\`, \`plan\`, \`country\`, and \`churned_at\`. Show each column name and its NULL count.

*Use a single query with COUNT and CASE to check all columns at once.*`,
    expectedSql: `SELECT
  COUNT(*) - COUNT(name) AS name_nulls,
  COUNT(*) - COUNT(email) AS email_nulls,
  COUNT(*) - COUNT(plan) AS plan_nulls,
  COUNT(*) - COUNT(country) AS country_nulls,
  COUNT(*) - COUNT(churned_at) AS churned_at_nulls
FROM users`,
    hints: [
      { level: 1, text: "COUNT(*) counts all rows. COUNT(column) counts non-NULL values. The difference is the NULL count." },
      { level: 2, text: "For each column: COUNT(*) - COUNT(column_name) gives the number of NULLs in that column." },
      { level: 3, text: "SELECT COUNT(*) - COUNT(name) AS name_nulls, COUNT(*) - COUNT(email) AS email_nulls, ... FROM users" },
    ],
    explanation: "COUNT(*) counts all rows regardless of NULLs, while COUNT(column) only counts non-NULL values. Subtracting gives the NULL count for each column.",
    tags: ["count", "null", "data-quality"],
    difficulty: "beginner",
  },
  {
    stepIndex: 1,
    title: "Detect Duplicate Emails",
    description: `Next check: **are there any duplicate emails?**

Find all email addresses that appear more than once in the \`users\` table. Show the email and how many times it appears. Sort by count descending.`,
    contextFromPreviousStep: "You've identified where NULLs exist. Now check for another common data issue: duplicates.",
    expectedSql: `SELECT email, COUNT(*) AS occurrences
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY occurrences DESC`,
    hints: [
      { level: 1, text: "GROUP BY email to aggregate by email address, then filter for groups with more than one entry." },
      { level: 2, text: "HAVING COUNT(*) > 1 filters to only emails that appear multiple times." },
      { level: 3, text: "SELECT email, COUNT(*) AS occurrences FROM users GROUP BY email HAVING COUNT(*) > 1 ORDER BY occurrences DESC" },
    ],
    explanation: "GROUP BY collapses rows by email, and HAVING filters groups after aggregation. Only emails appearing 2+ times are returned.",
    tags: ["group-by", "having", "duplicates"],
    difficulty: "beginner",
  },
  {
    stepIndex: 2,
    title: "Referential Integrity Check",
    description: `Final integrity check: **do any orders reference users that don't exist?**

Find all orders where the \`user_id\` does not match any \`id\` in the \`users\` table. Show the order id, user_id, total_cents, and status. Also check for order_items referencing non-existent orders.

*Return the orphaned orders first, then any orphaned order_items, using UNION ALL.*`,
    contextFromPreviousStep: "You've checked for NULLs and duplicates within tables. Now verify that relationships between tables are intact.",
    expectedSql: `SELECT 'orphan_order' AS issue_type, o.id::text AS record_id, o.user_id::text AS ref_id
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
WHERE u.id IS NULL
UNION ALL
SELECT 'orphan_order_item' AS issue_type, oi.id::text AS record_id, oi.order_id::text AS ref_id
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL
ORDER BY issue_type, record_id`,
    hints: [
      { level: 1, text: "LEFT JOIN preserves all rows from the left table. If the right side is NULL, the reference is broken." },
      { level: 2, text: "LEFT JOIN orders to users, then WHERE u.id IS NULL finds orphaned orders. Do the same for order_items → orders." },
      { level: 3, text: "SELECT 'orphan_order', o.id::text, o.user_id::text FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE u.id IS NULL UNION ALL SELECT 'orphan_order_item', oi.id::text, oi.order_id::text FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE o.id IS NULL" },
    ],
    explanation: "LEFT JOIN + WHERE right.id IS NULL is the standard pattern for finding orphaned records. UNION ALL combines both checks into a single result set. The ::text casts ensure compatible column types.",
    tags: ["left-join", "null", "union", "referential-integrity"],
    difficulty: "intermediate",
  },
];
