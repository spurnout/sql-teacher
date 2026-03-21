import type { Exercise } from "@/lib/exercises/types";

export const dataQualityExercises: readonly Exercise[] = [
  {
    id: "cap-dq-orphans",
    phase: "capstone",
    order: 1,
    title: "Orphaned Records Detection",
    concept: "Referential integrity",
    mode: "open",
    difficulty: "intermediate",
    description: `## Data Audit: Find Orphaned Order Items

Find order_items that reference orders which no longer exist (orphaned records).

Show:
- \`oi.id\` AS \`orphan_item_id\`
- \`oi.order_id\`
- \`oi.product_id\`
- \`oi.quantity\`

Use a LEFT JOIN from order_items to orders and filter where the order is NULL.
Order by orphan_item_id.`,
    expectedSql: `SELECT oi.id AS orphan_item_id, oi.order_id, oi.product_id, oi.quantity FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE o.id IS NULL ORDER BY orphan_item_id`,
    explanation: "LEFT JOIN + IS NULL is the standard anti-join pattern for finding orphaned records. Foreign key constraints prevent this, but they're not always present on every relationship.",
    hints: [],
    tags: ["left-join", "anti-join", "data-quality", "null"],
  },
  {
    id: "cap-dq-null-report",
    phase: "capstone",
    order: 2,
    title: "NULL Anomaly Report",
    concept: "NULL analysis",
    mode: "open",
    difficulty: "intermediate",
    description: `## Data Audit: NULL Analysis

For the users table, create a report showing how many NULLs exist in each nullable column.

Show a single row with:
- \`total_users\` — COUNT(*)
- \`null_churned_at\` — count where churned_at IS NULL
- \`pct_not_churned\` — percentage of users with NULL churned_at (ROUND to 1 decimal)

This tells us what percentage of our user base is still active.`,
    expectedSql: `SELECT COUNT(*) AS total_users, COUNT(*) FILTER (WHERE churned_at IS NULL) AS null_churned_at, ROUND(COUNT(*) FILTER (WHERE churned_at IS NULL) * 100.0 / COUNT(*), 1) AS pct_not_churned FROM users`,
    explanation: "FILTER clause with aggregate functions is the cleanest way to compute conditional counts in a single pass. This is more readable than CASE WHEN inside COUNT.",
    hints: [],
    tags: ["null", "filter", "aggregate", "data-quality"],
  },
  {
    id: "cap-dq-duplicates",
    phase: "capstone",
    order: 3,
    title: "Duplicate Detection",
    concept: "Finding duplicates",
    mode: "open",
    difficulty: "advanced",
    description: `## Data Audit: Find Duplicate Emails

Find users who share the same email address (potential duplicates). Show:
- \`email\`
- \`duplicate_count\` — how many users share that email
- \`user_ids\` — comma-separated list of their IDs (use \`STRING_AGG(id::text, ', ' ORDER BY id)\`)

Only show emails with more than 1 user. Order by duplicate_count descending.`,
    expectedSql: `SELECT email, COUNT(*) AS duplicate_count, STRING_AGG(id::text, ', ' ORDER BY id) AS user_ids FROM users GROUP BY email HAVING COUNT(*) > 1 ORDER BY duplicate_count DESC`,
    explanation: "STRING_AGG with ORDER BY is PostgreSQL's way to concatenate grouped values. HAVING COUNT(*) > 1 filters to only duplicate groups.",
    hints: [],
    tags: ["group-by", "having", "string-agg", "deduplication", "data-quality"],
  },
  {
    id: "cap-dq-integrity",
    phase: "capstone",
    order: 4,
    title: "Referential Integrity Audit",
    concept: "Cross-table consistency",
    mode: "open",
    difficulty: "advanced",
    description: `## Data Audit: Cross-Table Integrity

Check for orders that reference non-existent users AND subscriptions that reference non-existent products.

Return a combined report using UNION ALL with:
- \`issue_type\` — either 'order_missing_user' or 'subscription_missing_product'
- \`record_id\` — the ID of the orphaned record
- \`missing_ref_id\` — the ID that doesn't exist in the parent table

Order by issue_type, record_id.`,
    expectedSql: `SELECT 'order_missing_user' AS issue_type, o.id AS record_id, o.user_id AS missing_ref_id FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE u.id IS NULL UNION ALL SELECT 'subscription_missing_product' AS issue_type, s.id AS record_id, s.product_id AS missing_ref_id FROM subscriptions s LEFT JOIN products p ON p.id = s.product_id WHERE p.id IS NULL ORDER BY issue_type, record_id`,
    explanation: "Combining multiple integrity checks with UNION ALL gives a unified audit view. This pattern scales to any number of relationship checks.",
    hints: [],
    tags: ["union-all", "left-join", "anti-join", "data-quality", "integrity"],
  },
  {
    id: "cap-dq-outliers",
    phase: "capstone",
    order: 5,
    title: "Statistical Outlier Detection",
    concept: "Outlier analysis",
    mode: "open",
    difficulty: "advanced",
    description: `## Data Audit: Order Amount Outliers

Find orders with amounts that are statistical outliers (more than 2 standard deviations from the mean).

Show:
- \`id\` AS \`order_id\`
- \`user_id\`
- \`total_cents\`
- \`status\`

Use a CTE to calculate the AVG and STDDEV of total_cents from orders, then filter orders where total_cents > avg + 2 * stddev OR total_cents < avg - 2 * stddev.
Order by total_cents descending.`,
    expectedSql: `WITH stats AS (SELECT AVG(total_cents) AS avg_cents, STDDEV(total_cents) AS stddev_cents FROM orders) SELECT o.id AS order_id, o.user_id, o.total_cents, o.status FROM orders o, stats WHERE o.total_cents > stats.avg_cents + 2 * stats.stddev_cents OR o.total_cents < stats.avg_cents - 2 * stats.stddev_cents ORDER BY o.total_cents DESC`,
    explanation: "Statistical outlier detection using CTE + AVG + STDDEV is a fundamental data quality technique. The 2-sigma rule flags roughly 5% of data as potential outliers.",
    hints: [],
    tags: ["cte", "aggregate", "stddev", "outlier", "data-quality"],
  },
];
