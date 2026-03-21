import type { Exercise } from "@/lib/exercises/types";

export const phase7Exercises: readonly Exercise[] = [
  {
    id: "p7-data-types-worked",
    phase: "phase-7",
    order: 1,
    title: "Data Types in PostgreSQL",
    concept: "Data types",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Choosing Data Types

Every column has a type. Here are the essential PostgreSQL types:

| Type | Use For | Example |
|------|---------|---------|
| \`TEXT\` | Variable-length strings | names, emails, descriptions |
| \`VARCHAR(n)\` | Strings with max length | zip codes, country codes |
| \`INTEGER\` / \`INT\` | Whole numbers (-2B to 2B) | counts, IDs |
| \`BIGINT\` | Large whole numbers | timestamps as epoch, large IDs |
| \`NUMERIC(p,s)\` | Exact decimals | money, measurements |
| \`BOOLEAN\` | true/false | flags, toggles |
| \`TIMESTAMPTZ\` | Date + time + timezone | event timestamps |
| \`DATE\` | Date only | birthdays |
| \`JSONB\` | Structured JSON data | metadata, properties |
| \`UUID\` | Universally unique IDs | public-facing IDs |

**PostgreSQL tip:** Prefer \`TEXT\` over \`VARCHAR\` — there's no performance difference in PostgreSQL, and TEXT is simpler.

**See it in action:** Run this query to see the types of our tables' columns:

\`\`\`sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
\`\`\``,
    starterSql: `SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;`,
    expectedSql: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
    explanation: "Understanding data types is fundamental. The information_schema.columns view lets you inspect any table's column definitions — a key DBA skill.",
    hints: [],
    tags: ["data-types", "ddl", "information-schema"],
    skipValidation: true,
  },
  {
    id: "p7-create-table-worked",
    phase: "phase-7",
    order: 2,
    title: "CREATE TABLE with Constraints",
    concept: "CREATE TABLE",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Creating Tables

Here's a real-world CREATE TABLE statement with all common constraints:

\`\`\`sql
-- This is READ-ONLY — study the syntax, don't run it
CREATE TABLE invoices (
  id            SERIAL PRIMARY KEY,           -- auto-incrementing PK
  user_id       INTEGER NOT NULL              -- required field
                REFERENCES users(id)          -- foreign key
                ON DELETE CASCADE,            -- delete invoices if user deleted
  amount_cents  INTEGER NOT NULL
                CHECK (amount_cents > 0),     -- must be positive
  currency      VARCHAR(3) NOT NULL
                DEFAULT 'USD',                -- default value
  status        TEXT NOT NULL
                DEFAULT 'pending'
                CHECK (status IN ('pending', 'paid', 'cancelled')),
  invoice_number TEXT UNIQUE,                 -- no duplicates allowed
  issued_at     TIMESTAMPTZ NOT NULL
                DEFAULT NOW(),
  paid_at       TIMESTAMPTZ                   -- nullable — NULL means unpaid
);
\`\`\`

**Constraint types:**
- \`PRIMARY KEY\` — unique + not null, one per table
- \`NOT NULL\` — column cannot be NULL
- \`UNIQUE\` — no duplicate values
- \`CHECK (expr)\` — custom validation rule
- \`DEFAULT value\` — used when INSERT doesn't specify the column
- \`REFERENCES table(col)\` — foreign key constraint
- \`ON DELETE CASCADE/SET NULL/RESTRICT\` — what happens when parent row is deleted

> **Study this pattern** — you'll see it in interviews and production codebases.`,
    starterSql: `-- Study the CREATE TABLE syntax above.
-- Let's verify our existing table structure instead:
SELECT
  tc.constraint_type,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'orders'
ORDER BY tc.constraint_type, kcu.column_name;`,
    expectedSql: `SELECT tc.constraint_type, tc.constraint_name, kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = 'orders' ORDER BY tc.constraint_type, kcu.column_name`,
    explanation: "Constraints enforce data integrity at the database level. This is more reliable than application-level validation because it applies regardless of how data enters the database.",
    hints: [],
    tags: ["create-table", "constraints", "ddl", "primary-key", "foreign-key"],
    skipValidation: true,
  },
  {
    id: "p7-alter-table-worked",
    phase: "phase-7",
    order: 3,
    title: "ALTER TABLE",
    concept: "ALTER TABLE",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Modifying Tables

ALTER TABLE changes an existing table's structure. Common operations:

\`\`\`sql
-- Add a column
ALTER TABLE users ADD COLUMN phone TEXT;

-- Add a column with a default
ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;

-- Drop a column
ALTER TABLE users DROP COLUMN phone;

-- Rename a column
ALTER TABLE users RENAME COLUMN name TO full_name;

-- Change a column's type
ALTER TABLE users ALTER COLUMN plan TYPE VARCHAR(20);

-- Add a constraint
ALTER TABLE users ADD CONSTRAINT chk_plan
  CHECK (plan IN ('free', 'pro', 'enterprise'));

-- Drop a constraint
ALTER TABLE users DROP CONSTRAINT chk_plan;

-- Add a NOT NULL constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Remove NOT NULL
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
\`\`\`

**Important in production:**
- \`ADD COLUMN\` with a DEFAULT on a large table can lock it (pre-PG 11)
- \`DROP COLUMN\` marks it invisible but doesn't reclaim space immediately
- Always test ALTERs on a copy first

> **Explore:** Run the query below to see our users table structure.`,
    starterSql: `-- See the current users table structure:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;`,
    expectedSql: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`,
    explanation: "ALTER TABLE is how you evolve your schema over time. In production, always use migrations (versioned SQL files) to track these changes.",
    hints: [],
    tags: ["alter-table", "ddl", "schema-migration"],
    skipValidation: true,
  },
  {
    id: "p7-insert-worked",
    phase: "phase-7",
    order: 4,
    title: "INSERT INTO Basics",
    concept: "INSERT",
    mode: "worked-example",
    difficulty: "beginner",
    description: `## Worked Example: Adding Data

INSERT adds rows to a table. Three main forms:

**1. Insert specific values:**
\`\`\`sql
INSERT INTO users (name, email, plan, country, created_at)
VALUES ('Alice Smith', 'alice@example.com', 'pro', 'US', NOW());
\`\`\`

**2. Insert multiple rows:**
\`\`\`sql
INSERT INTO users (name, email, plan, country, created_at)
VALUES
  ('Bob Jones', 'bob@example.com', 'free', 'UK', NOW()),
  ('Carol White', 'carol@example.com', 'enterprise', 'DE', NOW());
\`\`\`

**3. Insert from a SELECT (copy data):**
\`\`\`sql
INSERT INTO archived_users (name, email, archived_at)
SELECT name, email, NOW()
FROM users
WHERE churned_at IS NOT NULL;
\`\`\`

**RETURNING clause** (PostgreSQL bonus):
\`\`\`sql
INSERT INTO users (name, email, plan, country, created_at)
VALUES ('Dave Lee', 'dave@example.com', 'pro', 'CA', NOW())
RETURNING id, name, created_at;
-- Returns the new row's auto-generated id!
\`\`\`

> **Note:** This is a read-only sandbox, so we can't run INSERT. Study the syntax — you'll use it daily as a DBA.`,
    starterSql: `-- We can't INSERT in this sandbox, but we can verify existing data:
SELECT id, name, email, plan, created_at
FROM users
ORDER BY id
LIMIT 5;`,
    expectedSql: `SELECT id, name, email, plan, created_at FROM users ORDER BY id LIMIT 5`,
    explanation: "INSERT is the most basic DML command. The RETURNING clause is a PostgreSQL feature that eliminates the need for a separate SELECT after inserting.",
    hints: [],
    tags: ["insert", "dml", "returning"],
    skipValidation: true,
  },
  {
    id: "p7-update-delete-worked",
    phase: "phase-7",
    order: 5,
    title: "UPDATE and DELETE",
    concept: "UPDATE, DELETE",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Modifying and Removing Data

**UPDATE** changes existing rows:
\`\`\`sql
-- Update specific rows
UPDATE users SET plan = 'pro' WHERE id = 42;

-- Update with calculation
UPDATE products SET price_cents = price_cents * 1.10
WHERE category = 'premium';

-- Update with a subquery
UPDATE users SET plan = 'enterprise'
WHERE id IN (SELECT user_id FROM orders WHERE total_cents > 10000);

-- UPDATE with RETURNING
UPDATE users SET plan = 'pro' WHERE id = 42
RETURNING id, name, plan;
\`\`\`

**DELETE** removes rows:
\`\`\`sql
-- Delete specific rows
DELETE FROM users WHERE churned_at < '2023-01-01';

-- Delete with subquery
DELETE FROM order_items
WHERE order_id IN (SELECT id FROM orders WHERE status = 'cancelled');
\`\`\`

**⚠️ CRITICAL SAFETY RULE:**
\`\`\`sql
-- NEVER run UPDATE/DELETE without WHERE!
UPDATE users SET plan = 'free';  -- Changes EVERY user!
DELETE FROM users;                -- Deletes EVERY user!

-- Always: SELECT first, then UPDATE/DELETE
SELECT * FROM users WHERE churned_at < '2023-01-01';  -- Preview
DELETE FROM users WHERE churned_at < '2023-01-01';     -- Then delete
\`\`\`

> **Best practice:** Always run the WHERE clause as a SELECT first to verify which rows will be affected.`,
    starterSql: `-- Preview what an UPDATE would affect:
-- "Which users would change to 'pro' plan?"
SELECT id, name, plan
FROM users
WHERE plan = 'free' AND country = 'US'
LIMIT 10;`,
    expectedSql: `SELECT id, name, plan FROM users WHERE plan = 'free' AND country = 'US' LIMIT 10`,
    explanation: "The SELECT-before-UPDATE/DELETE pattern is a crucial habit. In production, you can also wrap dangerous operations in a transaction: BEGIN → UPDATE → verify → COMMIT or ROLLBACK.",
    hints: [],
    tags: ["update", "delete", "dml", "safety"],
    skipValidation: true,
  },
  {
    id: "p7-upsert-worked",
    phase: "phase-7",
    order: 6,
    title: "UPSERT with ON CONFLICT",
    concept: "UPSERT",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Insert or Update (UPSERT)

PostgreSQL's \`INSERT ... ON CONFLICT\` handles the "insert if new, update if exists" pattern:

\`\`\`sql
-- Insert new user, or update plan if email already exists
INSERT INTO users (name, email, plan, country, created_at)
VALUES ('Alice Smith', 'alice@example.com', 'pro', 'US', NOW())
ON CONFLICT (email) DO UPDATE SET
  plan = EXCLUDED.plan,           -- EXCLUDED = the row that would have been inserted
  name = EXCLUDED.name;

-- Insert or ignore (do nothing on conflict)
INSERT INTO user_progress (user_id, exercise_id)
VALUES (1, 'p0-select-star-worked')
ON CONFLICT (user_id, exercise_id) DO NOTHING;
\`\`\`

**Key concepts:**
- \`ON CONFLICT (column)\` — which unique constraint to check
- \`DO UPDATE SET\` — merge the new data
- \`EXCLUDED\` — reference to the row that was attempted to insert
- \`DO NOTHING\` — silently skip if duplicate

**Why UPSERT matters:**
- Prevents race conditions (two inserts at the same time)
- Atomic operation (no gap between "check if exists" and "insert")
- Replaces the fragile SELECT-then-INSERT pattern

> **This is actually used in our app!** The progress tracking uses ON CONFLICT DO NOTHING.`,
    starterSql: `-- See our progress tracking UPSERT in action:
-- The user_progress table has a UNIQUE(user_id, exercise_id) constraint
SELECT
  tc.constraint_type,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_progress'
ORDER BY tc.constraint_type, kcu.column_name;`,
    expectedSql: `SELECT tc.constraint_type, tc.constraint_name, kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = 'user_progress' ORDER BY tc.constraint_type, kcu.column_name`,
    explanation: "UPSERT is one of PostgreSQL's most powerful features. Other databases call it MERGE (SQL Server) or INSERT ... ON DUPLICATE KEY UPDATE (MySQL).",
    hints: [],
    tags: ["upsert", "on-conflict", "dml", "concurrency"],
    skipValidation: true,
  },
  {
    id: "p7-quiz-data-types",
    phase: "phase-7",
    order: 7,
    title: "Quiz: Choose the Right Data Type",
    concept: "Data type selection",
    mode: "quiz",
    difficulty: "beginner",
    description: `## Data Type Selection

You're designing a table to store product prices. The prices need to be exact (no floating point errors) and can range from $0.01 to $999,999.99.

Which data type is the best choice?`,
    expectedSql: "",
    explanation: "NUMERIC(8,2) provides exact decimal arithmetic, which is essential for money. FLOAT/DOUBLE can have rounding errors (e.g., 0.1 + 0.2 ≠ 0.3). INTEGER with cents (price_cents) is also acceptable and often preferred for its simplicity.",
    hints: [],
    tags: ["data-types", "ddl", "numeric"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "NUMERIC(8,2) — exact decimal with 2 decimal places", isCorrect: true },
      { id: "b", text: "FLOAT — floating point number", isCorrect: false },
      { id: "c", text: "TEXT — store as a formatted string like '$99.99'", isCorrect: false },
      { id: "d", text: "BIGINT — store everything in whole numbers", isCorrect: false },
    ],
  },
  {
    id: "p7-quiz-constraints",
    phase: "phase-7",
    order: 8,
    title: "Quiz: Constraint Violations",
    concept: "Constraint behavior",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## What Happens on Constraint Violation?

You have this table:
\`\`\`sql
CREATE TABLE products (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL CHECK (price > 0)
);
\`\`\`

You run: \`INSERT INTO products (name, price) VALUES ('Widget', -5);\`

What happens?`,
    expectedSql: "",
    explanation: "The CHECK constraint (price > 0) is violated because -5 is not greater than 0. PostgreSQL raises an error and the row is NOT inserted. The entire statement fails — constraints are enforced before the row is written.",
    hints: [],
    tags: ["constraints", "check", "ddl"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "ERROR: the CHECK constraint on price is violated, no row is inserted", isCorrect: true },
      { id: "b", text: "The row is inserted but price is set to NULL", isCorrect: false },
      { id: "c", text: "The row is inserted but price is set to 0", isCorrect: false },
      { id: "d", text: "WARNING is logged but the row is inserted as-is", isCorrect: false },
    ],
  },
  {
    id: "p7-quiz-safe-delete",
    phase: "phase-7",
    order: 9,
    title: "Quiz: Safe DELETE",
    concept: "DELETE safety",
    mode: "quiz",
    difficulty: "beginner",
    description: `## Which DELETE Is Dangerous?

A junior DBA needs to delete all cancelled orders. Which statement is the safest approach?`,
    expectedSql: "",
    explanation: "Option A is safest because it previews the affected rows first, then uses a specific WHERE clause. Running a SELECT with the same WHERE clause before DELETE lets you verify exactly which rows will be removed. Never run DELETE without WHERE, and always preview first.",
    hints: [],
    tags: ["delete", "dml", "safety"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "First: SELECT * FROM orders WHERE status = 'cancelled'; Then: DELETE FROM orders WHERE status = 'cancelled';", isCorrect: true },
      { id: "b", text: "DELETE FROM orders; then re-insert the non-cancelled ones", isCorrect: false },
      { id: "c", text: "DELETE FROM orders WHERE status != 'active' AND status != 'pending'", isCorrect: false },
      { id: "d", text: "TRUNCATE orders WHERE status = 'cancelled'", isCorrect: false },
    ],
  },
  {
    id: "p7-quiz-insert-syntax",
    phase: "phase-7",
    order: 10,
    title: "Quiz: INSERT Syntax",
    concept: "INSERT syntax",
    mode: "quiz",
    difficulty: "beginner",
    description: `## INSERT Syntax Check

Which INSERT statement is syntactically correct for adding a user?

\`\`\`sql
-- Table: users (id SERIAL, name TEXT NOT NULL, email TEXT NOT NULL, plan TEXT DEFAULT 'free')
\`\`\``,
    expectedSql: "",
    explanation: "Option A correctly specifies the columns to insert and provides matching values. Column names in the INSERT clause must match the VALUES in order and count. Columns with DEFAULT values (like plan) can be omitted.",
    hints: [],
    tags: ["insert", "dml", "syntax"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');", isCorrect: true },
      { id: "b", text: "INSERT users SET name = 'Alice', email = 'alice@example.com';", isCorrect: false },
      { id: "c", text: "INSERT INTO users VALUES ('Alice', 'alice@example.com');", isCorrect: false },
      { id: "d", text: "INSERT INTO users (name) VALUES ('Alice', 'alice@example.com');", isCorrect: false },
    ],
  },
  {
    id: "p7-quiz-alter-impact",
    phase: "phase-7",
    order: 11,
    title: "Quiz: ALTER TABLE Impact",
    concept: "ALTER TABLE implications",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## ALTER TABLE Risk Assessment

You have a production table with 10 million rows. Which ALTER TABLE operation is most likely to cause downtime?`,
    expectedSql: "",
    explanation: "Adding a NOT NULL column with a DEFAULT requires PostgreSQL to rewrite all 10M rows (in pre-PG 11). In PG 11+, adding a column with a constant DEFAULT is instant, but adding NOT NULL still requires a table scan to verify no existing rows would violate the constraint. Dropping a column is metadata-only and fast. Adding a nullable column is instant.",
    hints: [],
    tags: ["alter-table", "ddl", "performance"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "ADD COLUMN status TEXT NOT NULL DEFAULT 'active' (pre-PG 11: rewrites entire table)", isCorrect: true },
      { id: "b", text: "DROP COLUMN old_field (marks invisible, doesn't rewrite)", isCorrect: false },
      { id: "c", text: "ADD COLUMN notes TEXT (nullable, no default — instant)", isCorrect: false },
      { id: "d", text: "RENAME COLUMN name TO full_name (metadata change only)", isCorrect: false },
    ],
  },
  {
    id: "p7-quiz-upsert",
    phase: "phase-7",
    order: 12,
    title: "Quiz: UPSERT Behavior",
    concept: "ON CONFLICT behavior",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## UPSERT Behavior

Given:
\`\`\`sql
INSERT INTO products (id, name, price_cents)
VALUES (1, 'Widget Pro', 2999)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents;
\`\`\`

If a product with \`id = 1\` already exists with name 'Widget' and price 1999, what happens?`,
    expectedSql: "",
    explanation: "ON CONFLICT (id) detects the duplicate primary key. Instead of failing, it executes the DO UPDATE clause. EXCLUDED refers to the row that was attempted to be inserted, so EXCLUDED.name = 'Widget Pro' and EXCLUDED.price_cents = 2999. The existing row is updated to these new values.",
    hints: [],
    tags: ["upsert", "on-conflict", "dml"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "The existing row is updated to name='Widget Pro', price_cents=2999", isCorrect: true },
      { id: "b", text: "A second row with id=1 is inserted alongside the existing one", isCorrect: false },
      { id: "c", text: "An error is raised because id=1 already exists", isCorrect: false },
      { id: "d", text: "The INSERT is silently ignored and the existing row is unchanged", isCorrect: false },
    ],
  },
];
