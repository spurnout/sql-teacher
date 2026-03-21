import type { Exercise } from "@/lib/exercises/types";
import { phase0DebugExercises } from "./debug";

const phase0BaseExercises: readonly Exercise[] = [
  {
    id: "p0-select-star-worked",
    phase: "phase-0",
    order: 1,
    title: "Your First SQL Query",
    concept: "SELECT *",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Reading a Table

SQL is how you talk to a database. The most basic thing you can do is ask to see all the data in a table.

**The query:**

\`\`\`sql
SELECT * FROM users;
\`\`\`

**What each word means:**
- \`SELECT\` — "give me columns"
- \`*\` — "all of them"
- \`FROM users\` — "from the users table"
- \`;\` — ends the statement (optional here)

**Run the query** using the Run button (or Ctrl+Enter). You'll see every row from the \`users\` table.

> **Tip:** Our database has 6 tables: \`users\`, \`products\`, \`subscriptions\`, \`orders\`, \`order_items\`, and \`events\`. Try changing \`users\` to \`products\` and running again!`,
    starterSql: `SELECT * FROM users;`,
    expectedSql: `SELECT * FROM users`,
    explanation:
      "SELECT * FROM table_name is the most fundamental SQL query. The asterisk (*) is a wildcard meaning 'all columns'. Every SQL journey starts here.",
    hints: [],
    tags: ["select", "basics", "fundamentals"],
    skipValidation: true,
  },
  {
    id: "p0-column-select",
    phase: "phase-0",
    order: 2,
    title: "Choosing Specific Columns",
    concept: "Column Selection",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Picking Only What You Need

Instead of \`SELECT *\`, you can name exactly which columns you want. You can also rename columns using \`AS\`.

**Business question:** Show each user's name and plan — nothing else.

\`\`\`sql
SELECT
  name,
  email,
  plan AS subscription_plan
FROM users
ORDER BY name;
\`\`\`

**What's new here:**
- \`name, email, plan\` — list only the columns you want (comma-separated)
- \`AS subscription_plan\` — renames the column in the results
- \`ORDER BY name\` — sorts results alphabetically by name

**Run it**, then try changing the column list. What happens if you remove \`email\`?`,
    starterSql: `SELECT
  name,
  email,
  plan AS subscription_plan
FROM users
ORDER BY name;`,
    expectedSql: `SELECT
  name,
  email,
  plan AS subscription_plan
FROM users
ORDER BY name`,
    explanation:
      "Selecting specific columns (projection) is more efficient than SELECT * — you only fetch what you need. AS creates an alias that renames the column in output.",
    hints: [],
    tags: ["select", "columns", "alias", "order-by"],
    skipValidation: true,
  },
  {
    id: "p0-where-filter",
    phase: "phase-0",
    order: 3,
    title: "Filtering Rows With WHERE",
    concept: "WHERE Clause",
    mode: "scaffolded",
    difficulty: "beginner",
    description: `**Business question:** Show the name, email, and country of all users on the **'pro'** plan. Sort by name alphabetically.

The \`WHERE\` clause filters which rows to return — like a "show me only rows where this condition is true" instruction.

Fill in the blanks to complete the query.`,
    starterSql: `SELECT name, email, country
FROM users
WHERE ____ = ____
ORDER BY name;`,
    expectedSql: `SELECT name, email, country
FROM users
WHERE plan = 'pro'
ORDER BY name`,
    explanation:
      "WHERE filters rows before they're returned. String values must be wrapped in single quotes. The condition plan = 'pro' keeps only rows where the plan column equals the string 'pro'.",
    hints: [
      {
        level: 1,
        text: "WHERE compares a column to a value. For text values, wrap the value in single quotes: WHERE column = 'value'.",
      },
      {
        level: 2,
        text: "You want to filter on the `plan` column. The value you're looking for is the string 'pro'.",
      },
      {
        level: 3,
        text: "WHERE plan = 'pro' — column name on the left, the string value in single quotes on the right.",
      },
    ],
    tags: ["where", "filter", "basics"],
  },
  {
    id: "p0-comparison-ops",
    phase: "phase-0",
    order: 4,
    title: "Comparison Operators",
    concept: "Comparison & Logic Operators",
    mode: "open",
    difficulty: "beginner",
    description: `**Business question:** Find all orders that are **not** refunded and have a total over **$50** (5000 cents). Return the order id, total in dollars (total_cents / 100.0), and status. Sort by total descending.

**SQL comparison operators:**
| Operator | Meaning |
|----------|---------|
| \`=\` | equals |
| \`!=\` or \`<>\` | not equals |
| \`>\` | greater than |
| \`>=\` | greater than or equal |
| \`<\` | less than |
| \`<=\` | less than or equal |

**Combine conditions with AND / OR:**
\`\`\`sql
WHERE age > 18 AND country = 'US'
\`\`\``,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  id,
  total_cents / 100.0 AS total_dollars,
  status
FROM orders
WHERE status != 'refunded'
  AND total_cents > 5000
ORDER BY total_cents DESC`,
    explanation:
      "AND requires both conditions to be true. != means 'not equal to'. Arithmetic works inside SELECT — dividing cents by 100.0 gives dollars (the .0 ensures decimal division).",
    hints: [
      {
        level: 1,
        text: "You need two conditions joined with AND: one for status not equal to 'refunded', another for total_cents greater than 5000.",
      },
      {
        level: 2,
        text: "Use `WHERE status != 'refunded' AND total_cents > 5000`. In SELECT, compute dollars as `total_cents / 100.0 AS total_dollars`.",
      },
      {
        level: 3,
        text: "`SELECT id, total_cents / 100.0 AS total_dollars, status FROM orders WHERE status != 'refunded' AND total_cents > 5000 ORDER BY total_cents DESC`",
      },
    ],
    tags: ["where", "comparison", "and", "arithmetic"],
  },
  {
    id: "p0-order-limit",
    phase: "phase-0",
    order: 5,
    title: "Sorting and Limiting Results",
    concept: "ORDER BY & LIMIT",
    mode: "open",
    difficulty: "beginner",
    description: `**Business question:** What are the 5 most expensive products? Show product name, category, and price in dollars. Sort by price descending (most expensive first).

**Key clauses:**
- \`ORDER BY column DESC\` — sorts largest-to-smallest (ASC = smallest-to-largest, and is the default)
- \`LIMIT n\` — returns only the first n rows after sorting

\`\`\`sql
-- Example: 3 cheapest products
SELECT name, price_cents / 100.0 AS price
FROM products
ORDER BY price_cents ASC
LIMIT 3;
\`\`\``,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  name,
  category,
  price_cents / 100.0 AS price_dollars
FROM products
ORDER BY price_cents DESC
LIMIT 5`,
    explanation:
      "ORDER BY controls sort direction (ASC/DESC). LIMIT caps the number of rows. Together they're how you get 'top N' results. Always sort before limiting to get meaningful results.",
    hints: [
      {
        level: 1,
        text: "SELECT from the products table. Use ORDER BY price_cents to sort by price and LIMIT to cap results.",
      },
      {
        level: 2,
        text: "Use `ORDER BY price_cents DESC` for most expensive first, then `LIMIT 5` to get only the top 5.",
      },
      {
        level: 3,
        text: "`SELECT name, category, price_cents / 100.0 AS price_dollars FROM products ORDER BY price_cents DESC LIMIT 5`",
      },
    ],
    tags: ["order-by", "limit", "sorting"],
  },
  {
    id: "p0-aggregations",
    phase: "phase-0",
    order: 6,
    title: "Counting and Summing Data",
    concept: "Aggregate Functions",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Summarizing Data With Aggregates

**Aggregate functions** collapse many rows into a single summary number.

| Function | What it does |
|----------|--------------|
| \`COUNT(*)\` | counts all rows |
| \`COUNT(col)\` | counts non-NULL values |
| \`SUM(col)\` | adds up all values |
| \`AVG(col)\` | computes the average |
| \`MIN(col)\` | finds the smallest |
| \`MAX(col)\` | finds the largest |

**Business question:** What is the total revenue from completed orders, the number of completed orders, and the average order value?

\`\`\`sql
SELECT
  COUNT(*) AS completed_order_count,
  SUM(total_cents) / 100.0 AS total_revenue_dollars,
  AVG(total_cents) / 100.0 AS avg_order_dollars,
  MAX(total_cents) / 100.0 AS largest_order_dollars
FROM orders
WHERE status = 'completed';
\`\`\`

**Run it** to see how these functions summarize all completed orders into a single row.`,
    starterSql: `SELECT
  COUNT(*) AS completed_order_count,
  SUM(total_cents) / 100.0 AS total_revenue_dollars,
  AVG(total_cents) / 100.0 AS avg_order_dollars,
  MAX(total_cents) / 100.0 AS largest_order_dollars
FROM orders
WHERE status = 'completed';`,
    expectedSql: `SELECT
  COUNT(*) AS completed_order_count,
  SUM(total_cents) / 100.0 AS total_revenue_dollars,
  AVG(total_cents) / 100.0 AS avg_order_dollars,
  MAX(total_cents) / 100.0 AS largest_order_dollars
FROM orders
WHERE status = 'completed'`,
    explanation:
      "Aggregate functions like COUNT, SUM, AVG, MIN, MAX collapse many rows into one. They're the foundation of all analytics queries.",
    hints: [],
    tags: ["aggregate", "count", "sum", "avg", "analytics"],
    skipValidation: true,
  },
  {
    id: "p0-group-by",
    phase: "phase-0",
    order: 7,
    title: "Grouping Results With GROUP BY",
    concept: "GROUP BY",
    mode: "scaffolded",
    difficulty: "beginner",
    description: `**Business question:** How many users are on each plan? Show the plan name and user count, sorted by count descending.

\`GROUP BY\` splits rows into groups and applies an aggregate function to each group separately. Instead of one summary for all rows, you get one summary **per group**.

\`\`\`sql
-- Pattern:
SELECT column, COUNT(*)
FROM table
GROUP BY column;
\`\`\`

Fill in the blanks:`,
    starterSql: `SELECT
  ____ AS plan,
  COUNT(____) AS user_count
FROM users
____ BY plan
ORDER BY user_count DESC;`,
    expectedSql: `SELECT
  plan AS plan,
  COUNT(*) AS user_count
FROM users
GROUP BY plan
ORDER BY user_count DESC`,
    explanation:
      "GROUP BY splits the table into groups (one per distinct plan value) and COUNT(*) counts rows in each group. Every non-aggregate column in SELECT must appear in GROUP BY.",
    hints: [
      {
        level: 1,
        text: "GROUP BY splits rows into buckets. Each unique value in the GROUP BY column becomes its own bucket, and COUNT(*) counts how many rows fall into each bucket.",
      },
      {
        level: 2,
        text: "The first blank is the column you want to group on: `plan`. The second blank in COUNT can be `*` to count all rows in each group. The third blank keyword is `GROUP`.",
      },
      {
        level: 3,
        text: "Complete query: `SELECT plan AS plan, COUNT(*) AS user_count FROM users GROUP BY plan ORDER BY user_count DESC`",
      },
    ],
    tags: ["group-by", "count", "aggregate"],
  },
  {
    id: "p0-having",
    phase: "phase-0",
    order: 8,
    title: "Filtering Groups With HAVING",
    concept: "HAVING",
    mode: "open",
    difficulty: "beginner",
    description: `**Business question:** Which product categories have more than 1 product? Show the category name and product count. Sort by count descending.

**WHERE vs HAVING:**
- \`WHERE\` filters **individual rows** (before grouping)
- \`HAVING\` filters **groups** (after grouping, on aggregate values)

\`\`\`sql
-- You CANNOT do this:
WHERE COUNT(*) > 5   -- ❌ can't use aggregates in WHERE

-- You CAN do this:
HAVING COUNT(*) > 5  -- ✅ filters groups by their aggregate value
\`\`\``,
    starterSql: `-- Write your query here\n`,
    expectedSql: `SELECT
  category,
  COUNT(*) AS product_count
FROM products
GROUP BY category
HAVING COUNT(*) > 1
ORDER BY product_count DESC`,
    explanation:
      "HAVING filters after GROUP BY, letting you exclude groups that don't meet a condition. It's the only place you can filter on aggregate values like COUNT(*) or SUM(...).",
    hints: [
      {
        level: 1,
        text: "GROUP BY category to count products per category, then use HAVING to filter out categories with only 1 product.",
      },
      {
        level: 2,
        text: "`SELECT category, COUNT(*) AS product_count FROM products GROUP BY category` — then add HAVING COUNT(*) > 1.",
      },
      {
        level: 3,
        text: "`SELECT category, COUNT(*) AS product_count FROM products GROUP BY category HAVING COUNT(*) > 1 ORDER BY product_count DESC`",
      },
    ],
    tags: ["having", "group-by", "aggregate", "filter"],
    variation: {
      description: `**Modified:** Now show product categories with **more than 2** products (not just more than 1).

Write a query that returns each product category and its product count, but only includes categories where the count is greater than **2**.`,
      starterSql: `-- Find categories with more than 2 products\nSELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY category\nHAVING `,
      expectedSql: `SELECT category, COUNT(*) AS product_count
FROM products
GROUP BY category
HAVING COUNT(*) > 2
ORDER BY product_count DESC`,
    },
  },

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  {
    id: "p0-quiz-where-vs-having",
    phase: "phase-0",
    order: 9,
    title: "Quiz: WHERE vs HAVING",
    concept: "WHERE vs HAVING",
    mode: "quiz",
    difficulty: "beginner",
    description: `Which clause would you use to filter rows **before** they are grouped?`,
    expectedSql: "",
    explanation: `**WHERE** filters individual rows before any grouping happens. **HAVING** filters groups after \`GROUP BY\` has already run. You cannot use aggregate functions (like \`COUNT\`, \`SUM\`) in a WHERE clause.`,
    hints: [],
    tags: ["where", "having", "group-by", "fundamentals"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "WHERE", isCorrect: true },
      { id: "b", text: "HAVING", isCorrect: false },
      { id: "c", text: "FILTER", isCorrect: false },
      { id: "d", text: "GROUP BY", isCorrect: false },
    ],
  },
  {
    id: "p0-quiz-null-comparison",
    phase: "phase-0",
    order: 10,
    title: "Quiz: Checking for NULL",
    concept: "NULL Handling",
    mode: "quiz",
    difficulty: "beginner",
    description: `You want to find all users who have **not** churned (i.e., \`churned_at\` is empty/null). Which SQL condition is correct?`,
    expectedSql: "",
    explanation: `You must use \`IS NULL\` to check for NULL values — never \`= NULL\`. In SQL, \`NULL = NULL\` evaluates to UNKNOWN (not TRUE), so the condition would never match. Always use \`IS NULL\` or \`IS NOT NULL\`.`,
    hints: [],
    tags: ["null", "where", "fundamentals"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "WHERE churned_at IS NULL", isCorrect: true },
      { id: "b", text: "WHERE churned_at = NULL", isCorrect: false },
      { id: "c", text: "WHERE churned_at == NULL", isCorrect: false },
      { id: "d", text: "WHERE churned_at IS EMPTY", isCorrect: false },
    ],
  },
  {
    id: "p0-quiz-count-star",
    phase: "phase-0",
    order: 11,
    title: "Quiz: COUNT(*) vs COUNT(column)",
    concept: "Aggregate Functions",
    mode: "quiz",
    difficulty: "beginner",
    description: `What is the difference between \`COUNT(*)\` and \`COUNT(column_name)\`?`,
    expectedSql: "",
    explanation: `\`COUNT(*)\` counts **every row** regardless of NULL values. \`COUNT(column_name)\` counts only rows where that specific column is **not NULL**. Use \`COUNT(*)\` when you want total row count; use \`COUNT(col)\` when you want to count non-empty values.`,
    hints: [],
    tags: ["aggregate", "count", "null", "fundamentals"],
    skipValidation: true,
    quizOptions: [
      {
        id: "a",
        text: "COUNT(*) counts all rows; COUNT(col) skips NULL values in that column",
        isCorrect: true,
      },
      {
        id: "b",
        text: "They are identical — both count all rows",
        isCorrect: false,
      },
      {
        id: "c",
        text: "COUNT(col) counts all rows; COUNT(*) skips NULL values",
        isCorrect: false,
      },
      {
        id: "d",
        text: "COUNT(*) is slower and should always be avoided",
        isCorrect: false,
      },
    ],
  },
];

export const phase0Exercises: readonly Exercise[] = [...phase0BaseExercises, ...phase0DebugExercises];
