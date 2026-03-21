import type { ScenarioStep } from "@/lib/scenarios/types";

export const performanceInvestigationSteps: readonly ScenarioStep[] = [
  {
    stepIndex: 0,
    title: "Identify Heavy Hitters",
    description: `The engineering team reports slow database performance. Start your investigation: **which users generate the most database activity?**

Find the top 10 users by total number of events. Show the user's name, email, and event count. Sort by event count descending.`,
    expectedSql: `SELECT u.name, u.email, COUNT(e.id) AS event_count
FROM users u
JOIN events e ON e.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY event_count DESC
LIMIT 10`,
    hints: [
      { level: 1, text: "Join users to events and count the events per user." },
      { level: 2, text: "GROUP BY user, COUNT events, ORDER BY count DESC, LIMIT 10." },
      { level: 3, text: "SELECT u.name, u.email, COUNT(e.id) FROM users u JOIN events e ON e.user_id = u.id GROUP BY u.id, u.name, u.email ORDER BY event_count DESC LIMIT 10" },
    ],
    explanation: "JOIN + GROUP BY + COUNT identifies the most active users. LIMIT restricts to the top 10.",
    tags: ["join", "count", "limit", "performance"],
    difficulty: "beginner",
  },
  {
    stepIndex: 1,
    title: "Event Type Breakdown",
    description: `Now drill deeper: **what types of events are most common, and what's the average per user?**

Show each event type, the total count, the number of distinct users who triggered it, and the average events per user (rounded to 1 decimal). Sort by total count descending.`,
    contextFromPreviousStep: "You've identified the heaviest users. Now understand what kinds of events are driving the volume.",
    expectedSql: `SELECT
  event_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 1) AS avg_per_user
FROM events
GROUP BY event_type
ORDER BY total_events DESC`,
    hints: [
      { level: 1, text: "Use COUNT(*) for total events and COUNT(DISTINCT user_id) for unique users per event type." },
      { level: 2, text: "Divide total events by unique users for the average. Use ::numeric to ensure decimal division." },
      { level: 3, text: "SELECT event_type, COUNT(*), COUNT(DISTINCT user_id), ROUND(COUNT(*)::numeric / COUNT(DISTINCT user_id), 1) FROM events GROUP BY event_type ORDER BY total_events DESC" },
    ],
    explanation: "COUNT(DISTINCT user_id) counts unique users per event type. Casting to numeric ensures decimal division instead of integer truncation.",
    tags: ["count-distinct", "aggregate", "analysis"],
    difficulty: "intermediate",
  },
  {
    stepIndex: 2,
    title: "Peak Activity Windows",
    description: `Final piece of the investigation: **when is our database busiest?**

Show event counts grouped by hour of day (0-23). Include the hour, the total event count, and what percentage of all events occur in that hour (rounded to 1 decimal). Sort by hour.`,
    contextFromPreviousStep: "You know who the heavy users are and what events they trigger. Now find when the load peaks so the team can optimize.",
    expectedSql: `SELECT
  EXTRACT(HOUR FROM occurred_at)::integer AS hour_of_day,
  COUNT(*) AS event_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_of_total
FROM events
GROUP BY EXTRACT(HOUR FROM occurred_at)
ORDER BY hour_of_day`,
    hints: [
      { level: 1, text: "EXTRACT(HOUR FROM timestamp) gives the hour as a number 0-23." },
      { level: 2, text: "For percentage, divide each hour's count by the total. SUM(COUNT(*)) OVER () gives the grand total as a window function." },
      { level: 3, text: "SELECT EXTRACT(HOUR FROM occurred_at)::integer, COUNT(*), ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) FROM events GROUP BY ... ORDER BY hour_of_day" },
    ],
    explanation: "EXTRACT gets the hour component. The window function SUM(COUNT(*)) OVER () computes the grand total across all groups, enabling percentage calculation without a subquery.",
    tags: ["extract", "window-function", "percentage", "performance"],
    difficulty: "advanced",
  },
];
