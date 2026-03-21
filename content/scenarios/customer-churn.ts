import type { ScenarioStep } from "@/lib/scenarios/types";

export const customerChurnSteps: readonly ScenarioStep[] = [
  {
    stepIndex: 0,
    title: "Identify Churned Users",
    description: `The VP of Customer Success asks: **"Who has churned?"**

List all users who have a non-NULL \`churned_at\` date. Show their name, email, plan, and the date they churned. Sort by most recent churn first.`,
    expectedSql: `SELECT name, email, plan, churned_at
FROM users
WHERE churned_at IS NOT NULL
ORDER BY churned_at DESC`,
    hints: [
      { level: 1, text: "The `churned_at` column is NULL for active users and has a date for churned users." },
      { level: 2, text: "Use `WHERE churned_at IS NOT NULL` to filter to churned users only." },
      { level: 3, text: "SELECT name, email, plan, churned_at FROM users WHERE churned_at IS NOT NULL ORDER BY churned_at DESC" },
    ],
    explanation: "IS NOT NULL filters for rows where the column has a value. Churned users are identified by having a churned_at timestamp.",
    tags: ["null", "filter", "churn"],
    difficulty: "beginner",
  },
  {
    stepIndex: 1,
    title: "Churn Rate by Plan",
    description: `Now the VP asks: **"Which plans have the worst churn rates?"**

For each plan, show the total number of users, the number who churned, and the churn rate as a percentage (rounded to 1 decimal). Sort by churn rate descending.`,
    contextFromPreviousStep: "You've identified the churned users. Now aggregate by plan to see which plans lose the most customers.",
    expectedSql: `SELECT
  plan,
  COUNT(*) AS total_users,
  COUNT(churned_at) AS churned,
  ROUND(COUNT(churned_at) * 100.0 / COUNT(*), 1) AS churn_rate_pct
FROM users
GROUP BY plan
ORDER BY churn_rate_pct DESC`,
    hints: [
      { level: 1, text: "COUNT(*) counts all users, COUNT(churned_at) counts only those with a non-NULL churned_at." },
      { level: 2, text: "The churn rate is (churned / total) * 100. Use ROUND(..., 1) for one decimal place." },
      { level: 3, text: "SELECT plan, COUNT(*), COUNT(churned_at), ROUND(COUNT(churned_at) * 100.0 / COUNT(*), 1) FROM users GROUP BY plan ORDER BY churn_rate_pct DESC" },
    ],
    explanation: "COUNT(column) skips NULLs while COUNT(*) counts all rows. Dividing these gives the churn rate. Multiplying by 100.0 (not 100) ensures decimal division.",
    tags: ["count", "null", "percentage", "churn"],
    difficulty: "intermediate",
  },
  {
    stepIndex: 2,
    title: "Revenue Lost to Churn",
    description: `The VP needs a dollar figure: **"How much revenue did we lose from churned users?"**

Show the total revenue (in dollars) from completed orders placed by users who eventually churned, compared to revenue from users who did not churn. Label the groups \`'churned'\` and \`'active'\`.`,
    contextFromPreviousStep: "You know the churn rates by plan. Now quantify the revenue impact of those churned users.",
    expectedSql: `SELECT
  CASE WHEN u.churned_at IS NOT NULL THEN 'churned' ELSE 'active' END AS user_status,
  SUM(o.total_cents) / 100.0 AS total_revenue
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY CASE WHEN u.churned_at IS NOT NULL THEN 'churned' ELSE 'active' END
ORDER BY total_revenue DESC`,
    hints: [
      { level: 1, text: "Use a CASE expression to categorize users as 'churned' or 'active' based on churned_at." },
      { level: 2, text: "Join users to orders, filter completed orders, and GROUP BY the CASE expression." },
      { level: 3, text: "SELECT CASE WHEN u.churned_at IS NOT NULL THEN 'churned' ELSE 'active' END AS user_status, SUM(o.total_cents)/100.0 FROM users u JOIN orders o ON ... WHERE o.status='completed' GROUP BY ..." },
    ],
    explanation: "CASE WHEN creates a derived column that categorizes each user. Grouping by this expression lets you compare revenue between the two groups.",
    tags: ["case-when", "join", "aggregate", "churn"],
    difficulty: "intermediate",
  },
  {
    stepIndex: 3,
    title: "Churn Risk Indicators",
    description: `Final question: **"Can we predict who might churn next?"**

Find active users (not churned) who haven't placed any orders in the last 3 months of data. Show their name, email, plan, and the date of their last order. Sort by oldest last order first.

*Hint: Use the maximum order date in the database as "today" to calculate the 3-month window.*`,
    contextFromPreviousStep: "You've quantified the damage from churn. Now proactively identify users who might be at risk based on recent inactivity.",
    expectedSql: `SELECT u.name, u.email, u.plan, MAX(o.created_at)::date AS last_order_date
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.churned_at IS NULL
GROUP BY u.id, u.name, u.email, u.plan
HAVING MAX(o.created_at) < (SELECT MAX(created_at) FROM orders) - INTERVAL '3 months'
   OR MAX(o.created_at) IS NULL
ORDER BY last_order_date ASC NULLS FIRST`,
    hints: [
      { level: 1, text: "Use LEFT JOIN so users with no orders still appear. Use HAVING to filter after aggregation." },
      { level: 2, text: "Compare MAX(o.created_at) to the maximum date minus 3 months. Also include users with no orders at all (NULL)." },
      { level: 3, text: "LEFT JOIN orders, WHERE churned_at IS NULL, GROUP BY user, HAVING MAX(o.created_at) < (SELECT MAX(created_at) FROM orders) - INTERVAL '3 months' OR MAX(o.created_at) IS NULL" },
    ],
    explanation: "LEFT JOIN ensures users without any orders are included. HAVING filters groups (users) by their most recent order date. The OR IS NULL clause catches users who never ordered.",
    tags: ["left-join", "having", "interval", "prediction"],
    difficulty: "advanced",
  },
];
