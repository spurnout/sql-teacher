import type { CapstoneProject, PhaseId } from "@/lib/exercises/types";
import { salesDashboardExercises } from "./sales-dashboard";
import { userRetentionExercises } from "./user-retention";
import { dbHealthExercises } from "./db-health";
import { dataQualityExercises } from "./data-quality";

const ALL_REQUIRED_PHASES: readonly PhaseId[] = [
  "phase-0", "phase-1", "phase-2", "phase-3",
  "phase-4", "phase-5", "phase-6", "phase-7", "phase-8",
];

export const ALL_CAPSTONES: readonly CapstoneProject[] = [
  {
    id: "capstone-sales",
    title: "Sales Dashboard Architect",
    description: `You've been hired as the SQL analyst for a SaaS company. The CEO wants a **sales dashboard** with five key metrics. Write the queries that will power each widget.

No hints. No solutions. Just you and your SQL skills.`,
    exercises: salesDashboardExercises,
    requiredPhases: ALL_REQUIRED_PHASES,
  },
  {
    id: "capstone-retention",
    title: "User Retention Analyst",
    description: `The growth team needs a **retention report**. Your job: build the queries that reveal how well the product keeps its users over time.

Cohort analysis, churn rates, and lifetime value — the metrics investors ask about.`,
    exercises: userRetentionExercises,
    requiredPhases: ALL_REQUIRED_PHASES,
  },
  {
    id: "capstone-db-health",
    title: "Database Health Inspector",
    description: `Production database is acting up. As the on-call DBA, run a **health check** using PostgreSQL system catalogs.

Find table sizes, unused indexes, active connections, and performance bottlenecks.`,
    exercises: dbHealthExercises,
    requiredPhases: ALL_REQUIRED_PHASES,
  },
  {
    id: "capstone-data-quality",
    title: "Data Quality Detective",
    description: `Before a big data migration, you need to **audit data quality**. Find orphaned records, NULL anomalies, duplicates, and referential integrity issues.

Clean data = trustworthy analytics.`,
    exercises: dataQualityExercises,
    requiredPhases: ALL_REQUIRED_PHASES,
  },
];

export function getCapstone(capstoneId: string): CapstoneProject | undefined {
  return ALL_CAPSTONES.find((c) => c.id === capstoneId);
}
