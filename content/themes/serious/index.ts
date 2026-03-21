import type { ThemeDefinition } from "../types";
import { SCHEMA_REFERENCE } from "@/content/schema/reference";
import { phase0Exercises } from "@/content/exercises/phase-0-fundamentals";
import { phase1Exercises } from "@/content/exercises/phase-1-joins";
import { phase2Exercises } from "@/content/exercises/phase-2-subqueries";
import { phase3Exercises } from "@/content/exercises/phase-3-ctes";
import { phase4Exercises } from "@/content/exercises/phase-4-window-functions";
import { phase5Exercises } from "@/content/exercises/phase-5-optimization";
import { phase6Exercises } from "@/content/exercises/phase-6-sql-patterns";
import { phase7Exercises } from "@/content/exercises/phase-7-dml-ddl";
import { phase8Exercises } from "@/content/exercises/phase-8-db-admin";
import { ALL_CAPSTONES } from "@/content/capstones";
import { ALL_SCENARIOS } from "@/content/scenarios";
import type { Phase } from "@/lib/exercises/types";

const phases: readonly Phase[] = [
  {
    id: "phase-0",
    title: "SQL Fundamentals",
    description: "Learn SQL from scratch — SELECT, WHERE, ORDER BY, aggregations, and GROUP BY.",
    exercises: phase0Exercises,
  },
  {
    id: "phase-1",
    title: "JOIN Mastery",
    description: "Combine data from multiple tables using different types of joins.",
    exercises: phase1Exercises,
  },
  {
    id: "phase-2",
    title: "Subqueries",
    description: "Use queries inside queries to solve complex problems.",
    exercises: phase2Exercises,
  },
  {
    id: "phase-3",
    title: "CTEs",
    description: "Write readable, reusable query building blocks with WITH clauses.",
    exercises: phase3Exercises,
  },
  {
    id: "phase-4",
    title: "Window Functions",
    description: "Perform calculations across rows without collapsing results.",
    exercises: phase4Exercises,
  },
  {
    id: "phase-5",
    title: "Query Optimization",
    description: "Understand and improve query performance with EXPLAIN ANALYZE.",
    exercises: phase5Exercises,
  },
  {
    id: "phase-6",
    title: "Essential SQL Patterns",
    description: "Master CASE WHEN, COALESCE, string/date functions, set operations, and JSONB queries.",
    exercises: phase6Exercises,
  },
  {
    id: "phase-7",
    title: "DML & DDL Concepts",
    description: "Learn CREATE TABLE, INSERT, UPDATE, DELETE, constraints, and data types.",
    exercises: phase7Exercises,
  },
  {
    id: "phase-8",
    title: "Database Administration",
    description: "Indexes, views, transactions, VACUUM, GRANT/REVOKE, and system monitoring.",
    exercises: phase8Exercises,
  },
];

export const seriousTheme: ThemeDefinition = {
  id: "serious",
  name: "SaaS Analytics",
  tagline: "Real-world SaaS product database — users, subscriptions, orders, and events",
  icon: "📊",
  dbSchema: "theme_serious",
  schemaReference: SCHEMA_REFERENCE,
  phases,
  capstones: ALL_CAPSTONES,
  scenarios: ALL_SCENARIOS,
};
