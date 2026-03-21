import type { Exercise } from "@/lib/exercises/types";

export const dbHealthExercises: readonly Exercise[] = [
  {
    id: "cap-dbh-table-stats",
    phase: "capstone",
    order: 1,
    title: "Table Sizes and Row Counts",
    concept: "Table statistics",
    mode: "open",
    difficulty: "intermediate",
    description: `## Health Check: Table Statistics

Get an overview of all application tables. Show:
- \`relname\` AS \`table_name\`
- \`n_live_tup\` AS \`estimated_rows\` — estimated live row count
- \`n_dead_tup\` AS \`dead_rows\` — rows waiting for VACUUM
- \`last_autovacuum\`

From \`pg_stat_user_tables\`. Order by \`estimated_rows\` descending.`,
    expectedSql: `SELECT relname AS table_name, n_live_tup AS estimated_rows, n_dead_tup AS dead_rows, last_autovacuum FROM pg_stat_user_tables ORDER BY estimated_rows DESC`,
    explanation: "pg_stat_user_tables provides estimated row counts and maintenance status. High dead_rows relative to live rows suggests autovacuum needs tuning.",
    hints: [],
    tags: ["pg-stat", "dba", "monitoring"],
  },
  {
    id: "cap-dbh-index-usage",
    phase: "capstone",
    order: 2,
    title: "Index Usage Analysis",
    concept: "Index effectiveness",
    mode: "open",
    difficulty: "intermediate",
    description: `## Health Check: Index Effectiveness

Analyze how effectively indexes are being used. Show:
- \`relname\` AS \`table_name\`
- \`indexrelname\` AS \`index_name\`
- \`idx_scan\` — number of index scans
- \`idx_tup_read\` AS \`tuples_read\` — rows read from index
- \`idx_tup_fetch\` AS \`tuples_fetched\` — rows fetched from table via index

From \`pg_stat_user_indexes\`. Order by \`idx_scan\` descending.`,
    expectedSql: `SELECT relname AS table_name, indexrelname AS index_name, idx_scan, idx_tup_read AS tuples_read, idx_tup_fetch AS tuples_fetched FROM pg_stat_user_indexes ORDER BY idx_scan DESC`,
    explanation: "Comparing idx_scan across indexes reveals which are heavily used and which are dead weight. High tuples_read with low tuples_fetched may indicate an inefficient index.",
    hints: [],
    tags: ["pg-stat", "indexes", "dba", "performance"],
  },
  {
    id: "cap-dbh-index-coverage",
    phase: "capstone",
    order: 3,
    title: "Index Coverage Report",
    concept: "Schema vs index analysis",
    mode: "open",
    difficulty: "advanced",
    description: `## Health Check: Which Tables Lack Indexes?

Compare tables with their indexes to find coverage gaps. Show:
- \`t.relname\` AS \`table_name\`
- \`COUNT(i.indexrelname)\` AS \`index_count\`

Use \`pg_stat_user_tables t\` LEFT JOIN \`pg_stat_user_indexes i\` ON \`t.relname = i.relname\`.
Group by table_name. Order by index_count ascending (least-indexed tables first).`,
    expectedSql: `SELECT t.relname AS table_name, COUNT(i.indexrelname) AS index_count FROM pg_stat_user_tables t LEFT JOIN pg_stat_user_indexes i ON t.relname = i.relname GROUP BY t.relname ORDER BY index_count`,
    explanation: "Tables with zero or few indexes may be suffering from full table scans on every query. However, small tables (<1000 rows) don't need many indexes.",
    hints: [],
    tags: ["left-join", "pg-stat", "indexes", "dba"],
  },
  {
    id: "cap-dbh-connections",
    phase: "capstone",
    order: 4,
    title: "Connection Monitoring Snapshot",
    concept: "Active sessions",
    mode: "open",
    difficulty: "intermediate",
    description: `## Health Check: Active Connections

Create a connection summary. Show:
- \`state\` — connection state (active, idle, etc.)
- \`connection_count\` — COUNT of connections in that state
- \`oldest_connection\` — MIN(backend_start) — the oldest connection timestamp

From \`pg_stat_activity\`. Filter to current database (\`datname = current_database()\`).
Group by state. Order by connection_count descending.`,
    expectedSql: `SELECT state, COUNT(*) AS connection_count, MIN(backend_start) AS oldest_connection FROM pg_stat_activity WHERE datname = current_database() GROUP BY state ORDER BY connection_count DESC`,
    explanation: "Too many 'idle' connections waste resources. 'idle in transaction' connections are especially dangerous as they hold locks and prevent VACUUM.",
    hints: [],
    tags: ["pg-stat-activity", "monitoring", "dba", "connections"],
  },
];
