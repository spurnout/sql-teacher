import type { Scenario } from "@/lib/scenarios/types";
import { revenueReportSteps } from "./revenue-report";
import { customerChurnSteps } from "./customer-churn";
import { dataQualityAuditSteps } from "./data-quality-audit";
import { performanceInvestigationSteps } from "./performance-investigation";

export const ALL_SCENARIOS: readonly Scenario[] = [
  {
    id: "revenue-report",
    title: "Revenue Report Builder",
    narrative: `## Scenario: Building an Executive Revenue Report

You've just joined a SaaS company as their first data analyst. The CEO is preparing for the board meeting and needs a comprehensive revenue report.

Over the next 4 steps, you'll progressively build a complete revenue analysis — starting with simple monthly totals and ending with an executive dashboard query combining revenue trends, growth rates, and top products.

Each step builds on the previous one, just like in real analytical work.`,
    steps: revenueReportSteps,
    requiredPhases: ["phase-0", "phase-1", "phase-2", "phase-3", "phase-4"],
    concept: "Revenue Analysis",
    difficulty: "intermediate",
  },
  {
    id: "customer-churn",
    title: "Customer Churn Analysis",
    narrative: `## Scenario: Investigating Customer Churn

The VP of Customer Success is concerned about user retention. They need you to analyze churn patterns and identify at-risk users before they leave.

Over 4 steps, you'll build a complete churn analysis — from identifying who left, to calculating churn rates, quantifying revenue impact, and finally predicting who might churn next.`,
    steps: customerChurnSteps,
    requiredPhases: ["phase-0", "phase-1"],
    concept: "Churn Analysis",
    difficulty: "intermediate",
  },
  {
    id: "data-quality-audit",
    title: "Data Quality Audit",
    narrative: `## Scenario: Auditing Data Quality

Before the company migrates to a new analytics platform, the data engineering team needs a thorough quality audit. Your job: find NULLs, duplicates, and broken references across the database.

In 3 steps, you'll systematically check for the most common data quality issues that plague real-world databases.`,
    steps: dataQualityAuditSteps,
    requiredPhases: ["phase-0", "phase-1"],
    concept: "Data Quality",
    difficulty: "beginner",
  },
  {
    id: "performance-investigation",
    title: "Performance Investigation",
    narrative: `## Scenario: Database Performance Investigation

The engineering team is seeing slow query times and needs help understanding usage patterns. Your mission: analyze the \`events\` table to identify who is generating the most load, what they're doing, and when peak usage occurs.

In 3 steps, you'll build the usage analysis that will inform their optimization strategy.`,
    steps: performanceInvestigationSteps,
    requiredPhases: ["phase-0", "phase-1", "phase-4"],
    concept: "Performance Analysis",
    difficulty: "intermediate",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}
