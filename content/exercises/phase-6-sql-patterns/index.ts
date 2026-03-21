import type { Exercise } from "@/lib/exercises/types";

export const phase6Exercises: readonly Exercise[] = [
  {
    id: "p6-case-when-worked",
    phase: "phase-6",
    order: 1,
    title: "CASE WHEN Basics",
    concept: "CASE WHEN",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Conditional Logic in SQL

CASE WHEN lets you add if/then/else logic to your queries. There are two forms:

**Searched CASE** (most common):
\`\`\`sql
SELECT
  name,
  plan,
  CASE
    WHEN plan = 'enterprise' THEN 'Premium'
    WHEN plan = 'pro' THEN 'Standard'
    ELSE 'Basic'
  END AS tier
FROM users
ORDER BY name;
\`\`\`

**How it works:**
- Evaluates each \`WHEN\` condition top-to-bottom
- Returns the first match's \`THEN\` value
- Falls through to \`ELSE\` if nothing matches
- \`END\` closes the expression — don't forget it!

> **Try it:** Run the query, then try changing the conditions or adding a new tier.`,
    starterSql: `SELECT
  name,
  plan,
  CASE
    WHEN plan = 'enterprise' THEN 'Premium'
    WHEN plan = 'pro' THEN 'Standard'
    ELSE 'Basic'
  END AS tier
FROM users
ORDER BY name;`,
    expectedSql: `SELECT name, plan, CASE WHEN plan = 'enterprise' THEN 'Premium' WHEN plan = 'pro' THEN 'Standard' ELSE 'Basic' END AS tier FROM users ORDER BY name`,
    explanation: "CASE WHEN is SQL's conditional expression. It's evaluated row-by-row and returns the THEN value for the first matching WHEN condition.",
    hints: [],
    tags: ["case-when", "conditional", "fundamentals"],
    skipValidation: true,
  },
  {
    id: "p6-case-categorize",
    phase: "phase-6",
    order: 2,
    title: "Categorize Users by Plan",
    concept: "CASE in SELECT",
    mode: "scaffolded",
    difficulty: "beginner",
    description: `## Categorize Users

Use CASE WHEN to create a \`plan_category\` column that groups users:
- **'enterprise'** → \`'High Value'\`
- **'pro'** → \`'Mid Value'\`
- Everything else → \`'Growth'\`

Show: \`plan_category\`, count of users per category, ordered by count descending.`,
    starterSql: `SELECT
  CASE
    WHEN plan = 'enterprise' THEN 'High Value'
    WHEN ____ THEN 'Mid Value'
    ELSE ____
  END AS plan_category,
  COUNT(*) AS user_count
FROM users
GROUP BY plan_category
ORDER BY user_count DESC;`,
    expectedSql: `SELECT CASE WHEN plan = 'enterprise' THEN 'High Value' WHEN plan = 'pro' THEN 'Mid Value' ELSE 'Growth' END AS plan_category, COUNT(*) AS user_count FROM users GROUP BY plan_category ORDER BY user_count DESC`,
    explanation: "CASE WHEN can be used in GROUP BY — the alias works because PostgreSQL evaluates SELECT aliases before GROUP BY.",
    hints: [
      { level: 1, text: "The second WHEN should check for `plan = 'pro'`" },
      { level: 2, text: "The ELSE value should be `'Growth'`" },
      { level: 3, text: "Complete query: `WHEN plan = 'pro' THEN 'Mid Value' ELSE 'Growth'`" },
    ],
    tags: ["case-when", "group-by", "conditional"],
  },
  {
    id: "p6-case-aggregate",
    phase: "phase-6",
    order: 3,
    title: "CASE in Aggregate — Pivot Pattern",
    concept: "SUM(CASE WHEN ...)",
    mode: "open",
    difficulty: "intermediate",
    description: `## Pivot With CASE WHEN

A powerful pattern: use CASE WHEN inside aggregate functions to create pivot-style results.

**Your task:** Show a single row with 3 columns counting users per plan type:
- \`free_count\` — number of users on 'free' plan
- \`pro_count\` — number of users on 'pro' plan
- \`enterprise_count\` — number of users on 'enterprise' plan

**Hint:** \`COUNT(CASE WHEN plan = 'free' THEN 1 END)\` counts only rows where the CASE returns a value (non-NULL).`,
    expectedSql: `SELECT COUNT(CASE WHEN plan = 'free' THEN 1 END) AS free_count, COUNT(CASE WHEN plan = 'pro' THEN 1 END) AS pro_count, COUNT(CASE WHEN plan = 'enterprise' THEN 1 END) AS enterprise_count FROM users`,
    explanation: "This pivot pattern is extremely common in reporting. When CASE returns NULL (no match), COUNT ignores it. You can also use SUM(CASE WHEN ... THEN 1 ELSE 0 END) for the same result.",
    hints: [
      { level: 1, text: "Use COUNT(CASE WHEN plan = '...' THEN 1 END) for each plan type" },
      { level: 2, text: "You need three COUNT expressions in your SELECT, one per plan" },
      { level: 3, text: "`SELECT COUNT(CASE WHEN plan = 'free' THEN 1 END) AS free_count, COUNT(CASE WHEN plan = 'pro' THEN 1 END) AS pro_count, COUNT(CASE WHEN plan = 'enterprise' THEN 1 END) AS enterprise_count FROM users`" },
    ],
    tags: ["case-when", "aggregate", "pivot", "count"],
  },
  {
    id: "p6-coalesce-worked",
    phase: "phase-6",
    order: 4,
    title: "Handling NULLs with COALESCE",
    concept: "COALESCE, NULLIF",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: NULL-Safe Defaults

\`COALESCE\` returns the first non-NULL value from its arguments. Perfect for default values:

\`\`\`sql
SELECT
  name,
  COALESCE(churned_at::text, 'Still active') AS status,
  COALESCE(churned_at, NOW()) AS churned_or_now
FROM users
ORDER BY name
LIMIT 10;
\`\`\`

**Related function — NULLIF:**
- \`NULLIF(a, b)\` returns NULL if \`a = b\`, otherwise returns \`a\`
- Useful for avoiding division by zero: \`x / NULLIF(y, 0)\`

> **Try it:** Run the query and notice how \`COALESCE\` fills in for NULL values.`,
    starterSql: `SELECT
  name,
  COALESCE(churned_at::text, 'Still active') AS status,
  COALESCE(churned_at, NOW()) AS churned_or_now
FROM users
ORDER BY name
LIMIT 10;`,
    expectedSql: `SELECT name, COALESCE(churned_at::text, 'Still active') AS status, COALESCE(churned_at, NOW()) AS churned_or_now FROM users ORDER BY name LIMIT 10`,
    explanation: "COALESCE is a variadic function — you can pass any number of arguments. It evaluates left-to-right and returns the first non-NULL value.",
    hints: [],
    tags: ["coalesce", "null", "nullif", "fundamentals"],
    skipValidation: true,
  },
  {
    id: "p6-coalesce-report",
    phase: "phase-6",
    order: 5,
    title: "Default Values in Reports",
    concept: "COALESCE in queries",
    mode: "open",
    difficulty: "intermediate",
    description: `## NULL-Safe Report

Create a user report showing:
- \`name\`
- \`plan\`
- \`days_as_customer\` — days since they signed up (use \`created_at\`). Use: \`EXTRACT(DAY FROM NOW() - created_at)::int\`
- \`days_since_churn\` — days since they churned, but if they haven't churned (\`churned_at\` is NULL), show \`0\`

Order by \`days_as_customer\` descending, limit to 15 rows.`,
    expectedSql: `SELECT name, plan, EXTRACT(DAY FROM NOW() - created_at)::int AS days_as_customer, COALESCE(EXTRACT(DAY FROM NOW() - churned_at)::int, 0) AS days_since_churn FROM users ORDER BY days_as_customer DESC LIMIT 15`,
    explanation: "COALESCE wrapping the EXTRACT handles NULL churned_at values elegantly, showing 0 instead of NULL.",
    hints: [
      { level: 1, text: "For days_since_churn, use COALESCE to replace NULL with 0" },
      { level: 2, text: "`COALESCE(EXTRACT(DAY FROM NOW() - churned_at)::int, 0)`" },
      { level: 3, text: "Full SELECT: `name, plan, EXTRACT(DAY FROM NOW() - created_at)::int AS days_as_customer, COALESCE(EXTRACT(DAY FROM NOW() - churned_at)::int, 0) AS days_since_churn`" },
    ],
    tags: ["coalesce", "null", "extract", "date-functions"],
  },
  {
    id: "p6-like-pattern",
    phase: "phase-6",
    order: 6,
    title: "Pattern Matching with LIKE",
    concept: "LIKE / ILIKE",
    mode: "scaffolded",
    difficulty: "beginner",
    description: `## Pattern Matching

\`LIKE\` matches strings against patterns:
- \`%\` matches any sequence of characters
- \`_\` matches exactly one character
- \`ILIKE\` is case-insensitive (PostgreSQL extension)

**Your task:** Find all users whose email ends with \`'@gmail.com'\`. Show \`name\`, \`email\`, ordered by name.`,
    starterSql: `SELECT name, email
FROM users
WHERE email ____ '%@gmail.com'
ORDER BY name;`,
    expectedSql: `SELECT name, email FROM users WHERE email LIKE '%@gmail.com' ORDER BY name`,
    explanation: "LIKE with a leading % performs a suffix match. In production, this can't use a regular B-tree index — consider a trigram (pg_trgm) or reverse index for email lookups.",
    hints: [
      { level: 1, text: "Use LIKE or ILIKE for pattern matching" },
      { level: 2, text: "Replace the blank with `LIKE`" },
      { level: 3, text: "`WHERE email LIKE '%@gmail.com'`" },
    ],
    tags: ["like", "ilike", "pattern-matching", "string-functions"],
  },
  {
    id: "p6-string-functions-worked",
    phase: "phase-6",
    order: 7,
    title: "String Functions Toolkit",
    concept: "String functions",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: String Manipulation

PostgreSQL has powerful string functions. Here are the essentials:

\`\`\`sql
SELECT
  name,
  email,
  LENGTH(name) AS name_length,
  UPPER(name) AS name_upper,
  SPLIT_PART(email, '@', 2) AS email_domain,
  CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name FROM 2))) AS title_case
FROM users
ORDER BY name_length DESC
LIMIT 10;
\`\`\`

**Key functions:**
- \`LENGTH(text)\` — character count
- \`UPPER(text)\` / \`LOWER(text)\` — case conversion
- \`SPLIT_PART(text, delimiter, part)\` — split and pick
- \`LEFT(text, n)\` / \`RIGHT(text, n)\` — take n characters
- \`SUBSTRING(text FROM pos)\` — extract from position
- \`CONCAT(a, b, ...)\` or \`a || b\` — concatenation
- \`TRIM(text)\` — remove leading/trailing whitespace`,
    starterSql: `SELECT
  name,
  email,
  LENGTH(name) AS name_length,
  UPPER(name) AS name_upper,
  SPLIT_PART(email, '@', 2) AS email_domain,
  CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name FROM 2))) AS title_case
FROM users
ORDER BY name_length DESC
LIMIT 10;`,
    expectedSql: `SELECT name, email, LENGTH(name) AS name_length, UPPER(name) AS name_upper, SPLIT_PART(email, '@', 2) AS email_domain, CONCAT(UPPER(LEFT(name, 1)), LOWER(SUBSTRING(name FROM 2))) AS title_case FROM users ORDER BY name_length DESC LIMIT 10`,
    explanation: "String functions are essential for data cleaning and reporting. SPLIT_PART is a PostgreSQL-specific function that's incredibly useful for parsing delimited strings.",
    hints: [],
    tags: ["string-functions", "upper", "lower", "split-part", "concat", "length"],
    skipValidation: true,
  },
  {
    id: "p6-date-functions-worked",
    phase: "phase-6",
    order: 8,
    title: "Extract and Format Dates",
    concept: "Date/Time functions",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Date Functions

PostgreSQL date functions let you slice, dice, and format temporal data:

\`\`\`sql
SELECT
  name,
  created_at,
  EXTRACT(YEAR FROM created_at) AS signup_year,
  EXTRACT(MONTH FROM created_at) AS signup_month,
  TO_CHAR(created_at, 'Mon DD, YYYY') AS formatted_date,
  AGE(NOW(), created_at) AS account_age,
  created_at + INTERVAL '30 days' AS trial_end
FROM users
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

**Key functions:**
- \`EXTRACT(part FROM timestamp)\` — get year, month, day, dow, hour, etc.
- \`TO_CHAR(timestamp, format)\` — format as text (\`'YYYY-MM-DD'\`, \`'Mon DD'\`, etc.)
- \`AGE(a, b)\` — interval between two timestamps
- \`INTERVAL '30 days'\` — add/subtract time
- \`DATE_TRUNC('month', ts)\` — truncate to start of period`,
    starterSql: `SELECT
  name,
  created_at,
  EXTRACT(YEAR FROM created_at) AS signup_year,
  EXTRACT(MONTH FROM created_at) AS signup_month,
  TO_CHAR(created_at, 'Mon DD, YYYY') AS formatted_date,
  AGE(NOW(), created_at) AS account_age,
  created_at + INTERVAL '30 days' AS trial_end
FROM users
ORDER BY created_at DESC
LIMIT 10;`,
    expectedSql: `SELECT name, created_at, EXTRACT(YEAR FROM created_at) AS signup_year, EXTRACT(MONTH FROM created_at) AS signup_month, TO_CHAR(created_at, 'Mon DD, YYYY') AS formatted_date, AGE(NOW(), created_at) AS account_age, created_at + INTERVAL '30 days' AS trial_end FROM users ORDER BY created_at DESC LIMIT 10`,
    explanation: "Date manipulation is critical for any reporting or analytics work. EXTRACT + DATE_TRUNC are the workhorses for time-based aggregation.",
    hints: [],
    tags: ["date-functions", "extract", "to-char", "age", "interval"],
    skipValidation: true,
  },
  {
    id: "p6-date-range",
    phase: "phase-6",
    order: 9,
    title: "Date Range Analysis",
    concept: "Date arithmetic",
    mode: "open",
    difficulty: "intermediate",
    description: `## Date Range Query

Find all users who signed up in the year 2024. Show:
- \`name\`
- \`email\`
- \`created_at\`
- \`signup_month\` — the month number they signed up (use EXTRACT)

Order by \`created_at\`, and only include users who have NOT churned (\`churned_at IS NULL\`).`,
    expectedSql: `SELECT name, email, created_at, EXTRACT(MONTH FROM created_at) AS signup_month FROM users WHERE EXTRACT(YEAR FROM created_at) = 2024 AND churned_at IS NULL ORDER BY created_at`,
    explanation: "EXTRACT(YEAR FROM ...) is clean for year-based filtering. Alternatively you could use `created_at >= '2024-01-01' AND created_at < '2025-01-01'` which is more index-friendly.",
    hints: [
      { level: 1, text: "Use `EXTRACT(YEAR FROM created_at) = 2024` to filter by year" },
      { level: 2, text: "Add `AND churned_at IS NULL` to exclude churned users" },
      { level: 3, text: "Full WHERE: `WHERE EXTRACT(YEAR FROM created_at) = 2024 AND churned_at IS NULL`" },
    ],
    tags: ["date-functions", "extract", "where", "null"],
  },
  {
    id: "p6-distinct-worked",
    phase: "phase-6",
    order: 10,
    title: "SELECT DISTINCT vs DISTINCT ON",
    concept: "DISTINCT",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Removing Duplicates

**SELECT DISTINCT** removes duplicate rows from results:
\`\`\`sql
SELECT DISTINCT country FROM users ORDER BY country;
\`\`\`

**DISTINCT ON (PostgreSQL-specific)** keeps only the first row per group:
\`\`\`sql
SELECT DISTINCT ON (country)
  country, name, created_at
FROM users
ORDER BY country, created_at ASC;
\`\`\`

This returns the **earliest-signed-up user per country**. The ORDER BY must start with the DISTINCT ON column(s).

> **Try both:** Run each query to see the difference. DISTINCT ON is like a simpler version of ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) WHERE rn = 1.`,
    starterSql: `-- Try DISTINCT first:
SELECT DISTINCT country FROM users ORDER BY country;

-- Then try DISTINCT ON:
-- SELECT DISTINCT ON (country)
--   country, name, created_at
-- FROM users
-- ORDER BY country, created_at ASC;`,
    expectedSql: `SELECT DISTINCT country FROM users ORDER BY country`,
    explanation: "DISTINCT ON is a PostgreSQL extension that's extremely useful. The ORDER BY must begin with the DISTINCT ON expressions to determine which row is 'first'.",
    hints: [],
    tags: ["distinct", "distinct-on", "deduplication"],
    skipValidation: true,
  },
  {
    id: "p6-union",
    phase: "phase-6",
    order: 11,
    title: "Combining Results with UNION",
    concept: "UNION / UNION ALL",
    mode: "scaffolded",
    difficulty: "intermediate",
    description: `## Set Operations: UNION

UNION combines results from two or more SELECT statements:
- \`UNION\` removes duplicates
- \`UNION ALL\` keeps all rows (faster)

**Your task:** Create a contact list with two sections. Combine:
1. All user names and emails with \`source\` = 'user'
2. All product names with NULL email and \`source\` = 'product'

Order the final result by \`source\`, then \`name\`.`,
    starterSql: `SELECT name, email, 'user' AS source
FROM users
____
SELECT name, NULL AS email, 'product' AS source
FROM products
ORDER BY source, name;`,
    expectedSql: `SELECT name, email, 'user' AS source FROM users UNION ALL SELECT name, NULL AS email, 'product' AS source FROM products ORDER BY source, name`,
    explanation: "UNION ALL is preferred when you know there are no duplicates (or want to keep them) because it avoids an expensive DISTINCT operation.",
    hints: [
      { level: 1, text: "Use UNION ALL to combine the two SELECT statements" },
      { level: 2, text: "Replace the blank with `UNION ALL`" },
      { level: 3, text: "Both SELECTs must have the same number of columns with compatible types" },
    ],
    tags: ["union", "union-all", "set-operations"],
  },
  {
    id: "p6-intersect-except",
    phase: "phase-6",
    order: 12,
    title: "Set Operations: INTERSECT & EXCEPT",
    concept: "INTERSECT, EXCEPT",
    mode: "open",
    difficulty: "advanced",
    description: `## Find Users Who Ordered But Never Subscribed

Use the \`EXCEPT\` set operation to find user IDs that appear in the \`orders\` table but NOT in the \`subscriptions\` table.

Show the \`user_id\` values, ordered ascending.

**Reminder:**
- \`INTERSECT\` — rows in both queries
- \`EXCEPT\` — rows in first query but NOT in second`,
    expectedSql: `SELECT user_id FROM orders EXCEPT SELECT user_id FROM subscriptions ORDER BY user_id`,
    explanation: "EXCEPT is the set-difference operation. It's semantically equivalent to NOT EXISTS or NOT IN but often more readable. Note: EXCEPT removes duplicates automatically.",
    hints: [
      { level: 1, text: "Write two SELECT statements: one for order user_ids, one for subscription user_ids" },
      { level: 2, text: "Connect them with EXCEPT — the first set minus the second set" },
      { level: 3, text: "`SELECT user_id FROM orders EXCEPT SELECT user_id FROM subscriptions ORDER BY user_id`" },
    ],
    tags: ["except", "intersect", "set-operations", "anti-join"],
  },
  {
    id: "p6-jsonb-worked",
    phase: "phase-6",
    order: 13,
    title: "Querying JSONB Data",
    concept: "JSONB operators",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: JSONB Queries

The \`events\` table has a \`properties\` JSONB column. Here's how to query it:

\`\`\`sql
SELECT
  e.event_type,
  e.properties,
  e.properties->>'page' AS page,
  e.properties->>'duration' AS duration_text,
  (e.properties->>'duration')::int AS duration_int
FROM events e
WHERE e.properties ? 'page'
ORDER BY e.occurred_at DESC
LIMIT 10;
\`\`\`

**Key JSONB operators:**
- \`->>\` — get value as text
- \`->\` — get value as JSONB (for nested access)
- \`?\` — does the key exist?
- \`@>\` — does it contain this JSON?
  - Example: \`properties @> '{"page": "/home"}'\`

> **Try it:** Run the query, then try filtering with \`@>\`.`,
    starterSql: `SELECT
  e.event_type,
  e.properties,
  e.properties->>'page' AS page,
  e.properties->>'duration' AS duration_text,
  (e.properties->>'duration')::int AS duration_int
FROM events e
WHERE e.properties ? 'page'
ORDER BY e.occurred_at DESC
LIMIT 10;`,
    expectedSql: `SELECT e.event_type, e.properties, e.properties->>'page' AS page, e.properties->>'duration' AS duration_text, (e.properties->>'duration')::int AS duration_int FROM events e WHERE e.properties ? 'page' ORDER BY e.occurred_at DESC LIMIT 10`,
    explanation: "JSONB is one of PostgreSQL's killer features. The ->> operator extracts a value as text, while -> keeps it as JSONB for chained access like properties->'nested'->>'field'.",
    hints: [],
    tags: ["jsonb", "json", "operators", "properties"],
    skipValidation: true,
  },
  {
    id: "p6-jsonb-aggregate",
    phase: "phase-6",
    order: 14,
    title: "JSONB Aggregation",
    concept: "JSONB analytics",
    mode: "open",
    difficulty: "advanced",
    description: `## Event Analytics with JSONB

Count the number of events grouped by the \`page\` property value extracted from the \`properties\` JSONB column.

Show:
- \`page\` — the page value from properties (use \`->>\` operator)
- \`event_count\` — count of events for that page

Only include events that have a 'page' key in their properties (use the \`?\` operator).
Order by \`event_count\` descending. Limit to 10.`,
    expectedSql: `SELECT properties->>'page' AS page, COUNT(*) AS event_count FROM events WHERE properties ? 'page' GROUP BY properties->>'page' ORDER BY event_count DESC LIMIT 10`,
    explanation: "Aggregating over JSONB field values is a common pattern in event analytics. A GIN index on the properties column would speed up the ? operator check.",
    hints: [
      { level: 1, text: "Extract the page with `properties->>'page'` and GROUP BY it" },
      { level: 2, text: "Filter with `WHERE properties ? 'page'` to skip events without a page" },
      { level: 3, text: "`SELECT properties->>'page' AS page, COUNT(*) AS event_count FROM events WHERE properties ? 'page' GROUP BY properties->>'page' ORDER BY event_count DESC LIMIT 10`" },
    ],
    tags: ["jsonb", "aggregate", "group-by", "analytics"],
  },
  {
    id: "p6-quiz-coalesce",
    phase: "phase-6",
    order: 15,
    title: "Quiz: COALESCE vs CASE",
    concept: "NULL handling",
    mode: "quiz",
    difficulty: "beginner",
    description: `## When to Use COALESCE vs CASE WHEN

Consider these two expressions:
1. \`COALESCE(churned_at, NOW())\`
2. \`CASE WHEN churned_at IS NULL THEN NOW() ELSE churned_at END\`

What is the relationship between them?`,
    expectedSql: "",
    explanation: "COALESCE is syntactic sugar for a specific CASE pattern. `COALESCE(a, b)` is equivalent to `CASE WHEN a IS NOT NULL THEN a ELSE b END`. Use COALESCE when you just need a default for NULL; use CASE WHEN for more complex conditional logic.",
    hints: [],
    tags: ["coalesce", "case-when", "null", "fundamentals"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "They produce identical results — COALESCE is shorthand for this CASE pattern", isCorrect: true },
      { id: "b", text: "COALESCE is faster because it's a built-in function", isCorrect: false },
      { id: "c", text: "They differ when churned_at is an empty string", isCorrect: false },
      { id: "d", text: "CASE WHEN handles multiple fallback values, COALESCE doesn't", isCorrect: false },
    ],
  },
  {
    id: "p6-quiz-union",
    phase: "phase-6",
    order: 16,
    title: "Quiz: UNION vs UNION ALL",
    concept: "Set operations",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## UNION vs UNION ALL

You have Query A (returns 100 rows) and Query B (returns 50 rows) with 20 rows that appear in both. What does each produce?

- \`Query A UNION Query B\`
- \`Query A UNION ALL Query B\``,
    expectedSql: "",
    explanation: "UNION removes duplicates, so 100 + 50 - 20 = 130 rows. UNION ALL keeps everything: 100 + 50 = 150 rows. UNION ALL is faster because it skips the deduplication sort/hash step.",
    hints: [],
    tags: ["union", "union-all", "set-operations"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "UNION: 130 rows, UNION ALL: 150 rows", isCorrect: true },
      { id: "b", text: "UNION: 150 rows, UNION ALL: 130 rows", isCorrect: false },
      { id: "c", text: "UNION: 130 rows, UNION ALL: 130 rows", isCorrect: false },
      { id: "d", text: "UNION: 20 rows, UNION ALL: 150 rows", isCorrect: false },
    ],
  },
  {
    id: "p6-quiz-jsonb",
    phase: "phase-6",
    order: 17,
    title: "Quiz: JSONB Operators",
    concept: "JSONB syntax",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## JSONB Operator Quiz

Given: \`properties = '{"page": "/home", "referrer": "google", "tags": ["sql", "tutorial"]}'\`

Which expression extracts the value \`"google"\` as a text string?`,
    expectedSql: "",
    explanation: "The ->> operator extracts a JSON value as text. -> would return it as a JSONB value (with quotes). For nested access, chain -> then ->>: properties->'nested'->>'field'.",
    hints: [],
    tags: ["jsonb", "operators", "json"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "properties->>'referrer'", isCorrect: true },
      { id: "b", text: "properties->'referrer'", isCorrect: false },
      { id: "c", text: "properties['referrer']", isCorrect: false },
      { id: "d", text: "properties.referrer", isCorrect: false },
    ],
  },
];
