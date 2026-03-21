import type { Exercise } from "@/lib/exercises/types";

export const userRetentionExercises: readonly Exercise[] = [
  {
    id: "cap-ret-cohorts",
    phase: "capstone",
    order: 1,
    title: "Monthly Signup Cohorts",
    concept: "Cohort definition",
    mode: "open",
    difficulty: "intermediate",
    description: `## Retention Report: Cohort Sizes

Define monthly signup cohorts. Show:
- \`cohort_month\` — DATE_TRUNC('month', created_at)
- \`cohort_size\` — number of users who signed up that month

Order by cohort_month ascending.`,
    expectedSql: `SELECT DATE_TRUNC('month', created_at) AS cohort_month, COUNT(*) AS cohort_size FROM users GROUP BY DATE_TRUNC('month', created_at) ORDER BY cohort_month`,
    explanation: "Cohort definition is the first step in any retention analysis. Each cohort is a group of users who started in the same time period.",
    hints: [],
    tags: ["cohort", "date-trunc", "group-by"],
  },
  {
    id: "cap-ret-churn",
    phase: "capstone",
    order: 2,
    title: "Churn Analysis",
    concept: "Churn rate",
    mode: "open",
    difficulty: "intermediate",
    description: `## Retention Report: Churn Rate

Calculate the churn rate per signup month cohort. Show:
- \`cohort_month\` — DATE_TRUNC('month', created_at)
- \`cohort_size\` — total users in the cohort
- \`churned_count\` — users who churned (churned_at IS NOT NULL)
- \`churn_rate_pct\` — ROUND percentage of churned users to 1 decimal

Order by cohort_month ascending.`,
    expectedSql: `SELECT DATE_TRUNC('month', created_at) AS cohort_month, COUNT(*) AS cohort_size, COUNT(churned_at) AS churned_count, ROUND(COUNT(churned_at) * 100.0 / COUNT(*), 1) AS churn_rate_pct FROM users GROUP BY DATE_TRUNC('month', created_at) ORDER BY cohort_month`,
    explanation: "COUNT(churned_at) only counts non-NULL values, making it perfect for counting churned users. This is the simplest churn metric.",
    hints: [],
    tags: ["cohort", "churn", "aggregate", "null"],
  },
  {
    id: "cap-ret-ltv",
    phase: "capstone",
    order: 3,
    title: "Lifetime Value by Plan",
    concept: "LTV estimation",
    mode: "open",
    difficulty: "advanced",
    description: `## Retention Report: Lifetime Value

Calculate average lifetime value (total spent) per user plan. Show:
- \`plan\`
- \`user_count\` — number of users on that plan
- \`avg_orders\` — average number of orders per user (ROUND to 1 decimal)
- \`avg_ltv_cents\` — average total spent per user in cents (ROUND to 0 decimals)

Use a CTE to first calculate per-user totals, then aggregate by plan.
Order by avg_ltv_cents descending.`,
    expectedSql: `WITH user_totals AS (SELECT u.id, u.plan, COUNT(o.id) AS order_count, COALESCE(SUM(o.total_cents), 0) AS total_spent_cents FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id, u.plan) SELECT plan, COUNT(*) AS user_count, ROUND(AVG(order_count), 1) AS avg_orders, ROUND(AVG(total_spent_cents)) AS avg_ltv_cents FROM user_totals GROUP BY plan ORDER BY avg_ltv_cents DESC`,
    explanation: "Two-stage aggregation with a CTE: first per-user totals, then per-plan averages. LEFT JOIN ensures users with zero orders still appear.",
    hints: [],
    tags: ["cte", "left-join", "aggregate", "ltv", "coalesce"],
  },
  {
    id: "cap-ret-engagement",
    phase: "capstone",
    order: 4,
    title: "Engagement Scoring",
    concept: "User engagement",
    mode: "open",
    difficulty: "advanced",
    description: `## Retention Report: Engagement Score

Rank users by engagement. For each user show:
- \`name\`
- \`plan\`
- \`event_count\` — total number of events
- \`order_count\` — total number of orders
- \`engagement_rank\` — RANK() ordered by event_count DESC

Use a CTE to compute per-user counts, then apply the window function.
Show only the top 20 users by engagement rank.`,
    expectedSql: `WITH user_engagement AS (SELECT u.id, u.name, u.plan, COUNT(DISTINCT e.id) AS event_count, COUNT(DISTINCT o.id) AS order_count FROM users u LEFT JOIN events e ON e.user_id = u.id LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id, u.name, u.plan) SELECT name, plan, event_count, order_count, RANK() OVER (ORDER BY event_count DESC) AS engagement_rank FROM user_engagement ORDER BY engagement_rank LIMIT 20`,
    explanation: "This combines CTEs, multiple LEFT JOINs with DISTINCT counts, and window functions — skills from across the entire curriculum.",
    hints: [],
    tags: ["cte", "window", "rank", "left-join", "engagement"],
  },
];
