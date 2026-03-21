import type { Exercise } from "@/lib/exercises/types";

export const phase8Exercises: readonly Exercise[] = [
  {
    id: "p8-index-strategies-worked",
    phase: "phase-8",
    order: 1,
    title: "CREATE INDEX Strategies",
    concept: "Index creation",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Index Types and When to Use Them

Indexes speed up queries but slow down writes. Here are the key types:

**B-tree (default)** — for equality and range queries:
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);
\`\`\`

**Composite index** — for multi-column lookups:
\`\`\`sql
-- Leftmost prefix rule: this helps WHERE user_id = X
-- AND also WHERE user_id = X AND created_at > Y
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
\`\`\`

**Partial index** — index only matching rows:
\`\`\`sql
-- Only index active subscriptions (smaller, faster)
CREATE INDEX idx_subs_active ON subscriptions(user_id)
WHERE status = 'active';
\`\`\`

**Concurrent creation** — no table lock:
\`\`\`sql
-- CRITICAL for production! Regular CREATE INDEX locks writes
CREATE INDEX CONCURRENTLY idx_events_type ON events(event_type);
\`\`\`

**Covering index** (PG 11+) — includes extra columns:
\`\`\`sql
CREATE INDEX idx_users_plan_cover ON users(plan) INCLUDE (name, email);
-- Index-only scan: no need to read the table at all
\`\`\`

> **Let's see what indexes exist on our tables:**`,
    starterSql: `SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;`,
    expectedSql: `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`,
    explanation: "Index strategy is one of the most impactful DBA skills. The right indexes can turn a 30-second query into a 30-millisecond query. Always use CONCURRENTLY in production.",
    hints: [],
    tags: ["index", "create-index", "ddl", "performance"],
    skipValidation: true,
  },
  {
    id: "p8-table-metadata",
    phase: "phase-8",
    order: 2,
    title: "Explore Table Metadata",
    concept: "information_schema",
    mode: "open",
    difficulty: "intermediate",
    description: `## Schema Introspection

Query \`information_schema.columns\` to list all columns across all our application tables.

Show:
- \`table_name\`
- \`column_name\`
- \`data_type\`
- \`is_nullable\` (YES or NO)

Filter to only tables in the 'public' schema (\`table_schema = 'public'\`).
Order by \`table_name\`, then \`ordinal_position\`.`,
    expectedSql: `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
    explanation: "information_schema is the SQL standard way to inspect database metadata. Every DBA should be comfortable querying it to understand and document database structures.",
    hints: [
      { level: 1, text: "Query `information_schema.columns` with `WHERE table_schema = 'public'`" },
      { level: 2, text: "SELECT table_name, column_name, data_type, is_nullable" },
      { level: 3, text: "ORDER BY table_name, ordinal_position — ordinal_position gives the column order" },
    ],
    tags: ["information-schema", "metadata", "dba", "introspection"],
  },
  {
    id: "p8-unused-indexes",
    phase: "phase-8",
    order: 3,
    title: "Find Unused Indexes",
    concept: "pg_stat_user_indexes",
    mode: "open",
    difficulty: "advanced",
    description: `## Detect Unused Indexes

Unused indexes waste disk space and slow down writes. Query \`pg_stat_user_indexes\` to find indexes that have never been used (or rarely used).

Show:
- \`relname\` AS \`table_name\` — the table
- \`indexrelname\` AS \`index_name\` — the index
- \`idx_scan\` — number of times the index was scanned (0 = never used)

Only show indexes with \`idx_scan = 0\` (never used).
Order by \`table_name\`, \`index_name\`.

**Note:** Primary key indexes may show 0 scans but should NOT be dropped.`,
    expectedSql: `SELECT relname AS table_name, indexrelname AS index_name, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0 ORDER BY relname, indexrelname`,
    explanation: "Regularly auditing unused indexes is a key DBA practice. An index with idx_scan = 0 since the last statistics reset is a candidate for removal — but always check if it's a primary key or unique constraint first.",
    hints: [
      { level: 1, text: "Use `pg_stat_user_indexes` — it tracks index usage statistics" },
      { level: 2, text: "Filter with `WHERE idx_scan = 0` and SELECT relname, indexrelname, idx_scan" },
      { level: 3, text: "`SELECT relname AS table_name, indexrelname AS index_name, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0 ORDER BY relname, indexrelname`" },
    ],
    tags: ["pg-stat", "indexes", "dba", "performance", "unused-indexes"],
  },
  {
    id: "p8-views-worked",
    phase: "phase-8",
    order: 4,
    title: "CREATE VIEW & Materialized Views",
    concept: "Views",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Views

A **view** is a saved query that acts like a virtual table:

\`\`\`sql
-- Regular view (re-runs the query each time)
CREATE VIEW active_subscribers AS
SELECT u.name, u.email, s.status, s.mrr_cents
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status = 'active';

-- Then use it like a table:
SELECT * FROM active_subscribers WHERE mrr_cents > 5000;
\`\`\`

**Materialized view** — stores results physically (snapshot):
\`\`\`sql
CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', o.created_at) AS month,
  SUM(o.total_cents) AS revenue_cents,
  COUNT(*) AS order_count
FROM orders o
GROUP BY DATE_TRUNC('month', o.created_at);

-- Must be manually refreshed:
REFRESH MATERIALIZED VIEW monthly_revenue;
-- With CONCURRENTLY (no lock, requires unique index):
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;
\`\`\`

**When to use which:**
| Feature | View | Materialized View |
|---------|------|-------------------|
| Speed | Same as underlying query | Pre-computed, fast reads |
| Freshness | Always current | Stale until REFRESH |
| Storage | No storage | Stores data on disk |
| Use case | Abstraction, security | Dashboards, heavy aggregations |

> **Try querying** our existing data as if building a view:`,
    starterSql: `-- This query could be saved as a view:
SELECT
  u.name,
  u.email,
  u.plan,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total_cents), 0) AS total_spent_cents
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name, u.email, u.plan
ORDER BY total_spent_cents DESC
LIMIT 10;`,
    expectedSql: `SELECT u.name, u.email, u.plan, COUNT(o.id) AS order_count, COALESCE(SUM(o.total_cents), 0) AS total_spent_cents FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id, u.name, u.email, u.plan ORDER BY total_spent_cents DESC LIMIT 10`,
    explanation: "Views are a powerful abstraction tool. They simplify complex queries, provide security (expose only certain columns), and materialized views are essential for dashboard performance.",
    hints: [],
    tags: ["views", "materialized-view", "ddl", "abstraction"],
    skipValidation: true,
  },
  {
    id: "p8-transactions-worked",
    phase: "phase-8",
    order: 5,
    title: "Transactions Explained",
    concept: "Transactions",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Transactions

A transaction groups multiple operations into an all-or-nothing unit:

\`\`\`sql
BEGIN;  -- Start transaction

UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- Debit
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- Credit

-- If everything is correct:
COMMIT;  -- Make changes permanent

-- If something went wrong:
ROLLBACK;  -- Undo all changes since BEGIN
\`\`\`

**ACID properties:**
- **Atomicity** — all operations succeed or all fail
- **Consistency** — constraints are always enforced
- **Isolation** — concurrent transactions don't interfere
- **Durability** — committed data survives crashes

**SAVEPOINT** — partial rollback:
\`\`\`sql
BEGIN;
INSERT INTO orders (...) VALUES (...);
SAVEPOINT before_items;
INSERT INTO order_items (...) VALUES (...);  -- Error!
ROLLBACK TO before_items;  -- Undo only the items insert
INSERT INTO order_items (...) VALUES (...);  -- Try again
COMMIT;
\`\`\`

**In practice:**
- PostgreSQL auto-wraps single statements in transactions
- Your web framework likely manages transactions for you
- But knowing how to use them manually is essential for DBA work

> **Explore:** Let's see active transactions on our database:`,
    starterSql: `-- See current database activity:
SELECT
  pid,
  state,
  query,
  backend_start,
  xact_start
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid != pg_backend_pid()
ORDER BY backend_start DESC
LIMIT 10;`,
    expectedSql: `SELECT pid, state, query, backend_start, xact_start FROM pg_stat_activity WHERE datname = current_database() AND pid != pg_backend_pid() ORDER BY backend_start DESC LIMIT 10`,
    explanation: "Transactions are the foundation of data integrity. Without them, a crash between the debit and credit would leave the system in an inconsistent state.",
    hints: [],
    tags: ["transactions", "begin", "commit", "rollback", "acid"],
    skipValidation: true,
  },
  {
    id: "p8-isolation-worked",
    phase: "phase-8",
    order: 6,
    title: "Transaction Isolation Levels",
    concept: "Isolation levels",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: Isolation Levels

PostgreSQL supports four isolation levels that control what concurrent transactions can see:

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|-----------|-------------------|-------------|
| READ UNCOMMITTED* | No | Yes | Yes |
| **READ COMMITTED** (default) | No | Yes | Yes |
| **REPEATABLE READ** | No | No | No** |
| **SERIALIZABLE** | No | No | No |

*PostgreSQL treats READ UNCOMMITTED as READ COMMITTED
**PostgreSQL's REPEATABLE READ prevents phantoms too (SSI)

**READ COMMITTED** (default):
\`\`\`sql
-- Each statement sees the latest committed data
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT COUNT(*) FROM orders;  -- sees 100
-- Another transaction inserts a row and commits
SELECT COUNT(*) FROM orders;  -- sees 101!
COMMIT;
\`\`\`

**REPEATABLE READ:**
\`\`\`sql
-- Sees a frozen snapshot from start of transaction
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM orders;  -- sees 100
-- Another transaction inserts a row and commits
SELECT COUNT(*) FROM orders;  -- still sees 100!
COMMIT;
\`\`\`

**SERIALIZABLE:**
\`\`\`sql
-- Strongest guarantee: as if transactions ran one at a time
-- May throw serialization errors (must retry)
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- Your operations...
COMMIT;
\`\`\`

> **Check default isolation level:**`,
    starterSql: `-- Check the current transaction isolation level:
SHOW transaction_isolation;`,
    expectedSql: `SHOW transaction_isolation`,
    explanation: "READ COMMITTED is the right default for most applications. Use REPEATABLE READ for financial calculations that need consistent snapshots. SERIALIZABLE is for correctness-critical operations where you can handle retries.",
    hints: [],
    tags: ["transactions", "isolation-levels", "serializable", "read-committed"],
    skipValidation: true,
  },
  {
    id: "p8-vacuum-worked",
    phase: "phase-8",
    order: 7,
    title: "VACUUM and ANALYZE",
    concept: "Table maintenance",
    mode: "worked-example",
    difficulty: "advanced",
    description: `## Worked Example: Table Maintenance

PostgreSQL uses MVCC (Multi-Version Concurrency Control) — old row versions aren't deleted immediately. VACUUM cleans them up.

**VACUUM** — reclaims dead tuple space:
\`\`\`sql
VACUUM users;               -- Standard vacuum (doesn't shrink table)
VACUUM FULL users;           -- Rewrites table (locks it! Use carefully)
VACUUM VERBOSE users;        -- Shows what it did
\`\`\`

**ANALYZE** — updates query planner statistics:
\`\`\`sql
ANALYZE users;               -- Update stats for one table
ANALYZE;                     -- Update stats for all tables
\`\`\`

**VACUUM ANALYZE** — both at once (common):
\`\`\`sql
VACUUM ANALYZE users;
\`\`\`

**Autovacuum** — PostgreSQL's automatic maintenance:
- Runs in the background
- Triggers based on dead tuple count
- Usually sufficient — but can fall behind on busy tables

**When to manually VACUUM:**
- After large DELETE/UPDATE operations
- Before running EXPLAIN ANALYZE for accurate plans
- When autovacuum can't keep up (check pg_stat_user_tables)

> **Check table health:**`,
    starterSql: `-- Check table statistics and dead tuples:
SELECT
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;`,
    expectedSql: `SELECT relname AS table_name, n_live_tup AS live_rows, n_dead_tup AS dead_rows, last_vacuum, last_autovacuum, last_analyze FROM pg_stat_user_tables ORDER BY n_dead_tup DESC`,
    explanation: "VACUUM is unique to PostgreSQL's MVCC architecture. Understanding dead tuples and autovacuum is essential for maintaining database health in production.",
    hints: [],
    tags: ["vacuum", "analyze", "autovacuum", "maintenance", "dba"],
    skipValidation: true,
  },
  {
    id: "p8-connections",
    phase: "phase-8",
    order: 8,
    title: "Monitor Active Connections",
    concept: "pg_stat_activity",
    mode: "open",
    difficulty: "intermediate",
    description: `## Connection Monitoring

Query \`pg_stat_activity\` to see all current database connections.

Show:
- \`pid\` — process ID
- \`usename\` AS \`username\` — who's connected
- \`state\` — current state (active, idle, etc.)
- \`query\` — the current/last query

Filter to only connections for the current database (\`datname = current_database()\`).
Exclude our own connection (\`pid != pg_backend_pid()\`).
Order by \`state\`, then \`pid\`.`,
    expectedSql: `SELECT pid, usename AS username, state, query FROM pg_stat_activity WHERE datname = current_database() AND pid != pg_backend_pid() ORDER BY state, pid`,
    explanation: "pg_stat_activity is your window into what's happening on the database right now. Use it to find long-running queries, idle connections consuming resources, and blocked processes.",
    hints: [
      { level: 1, text: "Query `pg_stat_activity` with appropriate WHERE filters" },
      { level: 2, text: "Filter: `WHERE datname = current_database() AND pid != pg_backend_pid()`" },
      { level: 3, text: "`SELECT pid, usename AS username, state, query FROM pg_stat_activity WHERE datname = current_database() AND pid != pg_backend_pid() ORDER BY state, pid`" },
    ],
    tags: ["pg-stat-activity", "monitoring", "dba", "connections"],
  },
  {
    id: "p8-grant-revoke-worked",
    phase: "phase-8",
    order: 9,
    title: "GRANT and REVOKE",
    concept: "Access control",
    mode: "worked-example",
    difficulty: "intermediate",
    description: `## Worked Example: Role-Based Access Control

PostgreSQL uses roles for authentication and authorization:

**Creating roles:**
\`\`\`sql
-- Create a role (user)
CREATE ROLE analyst LOGIN PASSWORD 'secure_password';

-- Create a group role (no login)
CREATE ROLE reporting_team;

-- Add user to group
GRANT reporting_team TO analyst;
\`\`\`

**Granting permissions:**
\`\`\`sql
-- Read-only access to specific tables
GRANT SELECT ON users, orders, products TO analyst;

-- Read-only access to ALL tables in a schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_team;

-- Read + write
GRANT SELECT, INSERT, UPDATE ON user_progress TO app_role;

-- All privileges
GRANT ALL PRIVILEGES ON orders TO admin_role;
\`\`\`

**Revoking permissions:**
\`\`\`sql
REVOKE INSERT, UPDATE ON users FROM analyst;
REVOKE ALL PRIVILEGES ON orders FROM analyst;
\`\`\`

**Default privileges** (for future tables):
\`\`\`sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO reporting_team;
\`\`\`

**Principle of least privilege:**
- Give minimum access needed
- Use group roles, not per-user grants
- Audit with: \`SELECT * FROM information_schema.role_table_grants\`

> **See our current role setup:**`,
    starterSql: `-- See table-level permissions:
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY grantee, table_name, privilege_type;`,
    expectedSql: `SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' ORDER BY grantee, table_name, privilege_type`,
    explanation: "Access control is a core DBA responsibility. The principle of least privilege — giving each role only the permissions it needs — is the foundation of database security.",
    hints: [],
    tags: ["grant", "revoke", "roles", "security", "dba"],
    skipValidation: true,
  },
  {
    id: "p8-quiz-index-types",
    phase: "phase-8",
    order: 10,
    title: "Quiz: Index Types",
    concept: "Index selection",
    mode: "quiz",
    difficulty: "intermediate",
    description: `## Choose the Right Index

You have a \`products\` table and frequently run this query:
\`\`\`sql
SELECT * FROM products
WHERE category = 'electronics' AND price_cents < 5000
ORDER BY price_cents;
\`\`\`

Which index best optimizes this query?`,
    expectedSql: "",
    explanation: "A composite B-tree index on (category, price_cents) is optimal. PostgreSQL can use the first column for equality (category = 'electronics'), then the second column for the range filter (price_cents < 5000) AND the ORDER BY — potentially enabling an index-only scan.",
    hints: [],
    tags: ["index", "composite-index", "performance", "b-tree"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "CREATE INDEX ON products(category, price_cents) — composite index matching both filter and sort", isCorrect: true },
      { id: "b", text: "CREATE INDEX ON products(price_cents, category) — wrong column order for equality filter", isCorrect: false },
      { id: "c", text: "CREATE INDEX ON products(category) — helps filter but not sort", isCorrect: false },
      { id: "d", text: "CREATE INDEX ON products USING GIN(category) — GIN is for arrays/JSONB, not single values", isCorrect: false },
    ],
  },
  {
    id: "p8-quiz-isolation",
    phase: "phase-8",
    order: 11,
    title: "Quiz: Transaction Isolation",
    concept: "Isolation problems",
    mode: "quiz",
    difficulty: "advanced",
    description: `## Isolation Level Scenarios

Transaction A starts and reads: \`SELECT balance FROM accounts WHERE id = 1;\` (sees 1000).

Meanwhile, Transaction B runs: \`UPDATE accounts SET balance = 500 WHERE id = 1; COMMIT;\`

Transaction A reads again: \`SELECT balance FROM accounts WHERE id = 1;\`

Under **READ COMMITTED** isolation (PostgreSQL default), what does Transaction A see on the second read?`,
    expectedSql: "",
    explanation: "Under READ COMMITTED, each statement sees the latest committed data at the time the statement starts. Since Transaction B committed before Transaction A's second SELECT, Transaction A sees the new value (500). Under REPEATABLE READ, it would still see 1000 (frozen snapshot).",
    hints: [],
    tags: ["transactions", "isolation-levels", "read-committed"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "500 — READ COMMITTED sees the latest committed data per statement", isCorrect: true },
      { id: "b", text: "1000 — the transaction sees a consistent snapshot", isCorrect: false },
      { id: "c", text: "Error — the row was modified by another transaction", isCorrect: false },
      { id: "d", text: "NULL — the row is locked by Transaction B", isCorrect: false },
    ],
  },
  {
    id: "p8-quiz-dba-emergency",
    phase: "phase-8",
    order: 12,
    title: "Quiz: DBA Emergency Response",
    concept: "DBA troubleshooting",
    mode: "quiz",
    difficulty: "advanced",
    description: `## Emergency: Database Is Slow

Your production database is running slow. Users are reporting timeouts. You connect and need to diagnose the problem.

What should be your **first** action?`,
    expectedSql: "",
    explanation: "Always diagnose before acting. `pg_stat_activity` shows all active connections, their current queries, and how long they've been running. This immediately reveals: long-running queries, lock contention, connection exhaustion, or idle-in-transaction sessions. Only after understanding the problem should you take action (cancel queries, tune settings, etc.).",
    hints: [],
    tags: ["dba", "troubleshooting", "pg-stat-activity", "monitoring"],
    skipValidation: true,
    quizOptions: [
      { id: "a", text: "Check pg_stat_activity for long-running queries and blocked processes", isCorrect: true },
      { id: "b", text: "Restart the PostgreSQL service immediately", isCorrect: false },
      { id: "c", text: "Run VACUUM FULL on all tables", isCorrect: false },
      { id: "d", text: "Increase max_connections in postgresql.conf", isCorrect: false },
    ],
  },
];
