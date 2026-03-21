import type { ThemeDefinition } from "../types";
import type { ThemeMapping } from "../shared/mapper";
import { mapPhases, mapCapstones, mapScenarios } from "../shared/mapper";
import { seriousTheme } from "../serious";
import { PROFESSIONAL_SCHEMA_REFERENCE } from "./schema";
import { ALL_SCENARIOS } from "@/content/scenarios";

/**
 * Professional theme mapping: TechCorp HR & Operations
 *
 * Tables:  users→employees, products→projects, subscriptions→assignments,
 *          orders→expenses, order_items→expense_items, events→timesheet_entries
 */
const professionalMapping: ThemeMapping = {
  tables: [
    ["order_items", "expense_items"],
    ["subscriptions", "assignments"],
    ["orders", "expenses"],
    ["products", "projects"],
    ["events", "timesheet_entries"],
    ["users", "employees"],
  ],
  columns: [
    ["unit_price_cents", "unit_cost_cents"],
    ["price_cents", "budget_cents"],
    ["mrr_cents", "hourly_rate"],
    ["product_id", "project_id"],
    ["user_id", "employee_id"],
    ["order_id", "expense_id"],
    ["event_type", "entry_type"],
    ["cancelled_at", "ended_at"],
    ["churned_at", "terminated_at"],
    ["occurred_at", "logged_at"],
    ["plan", "role"],
    ["country", "department"],
    // total_cents stays the same for expenses
    // email stays the same for employees
  ],
  values: [
    // Plan → role values
    ["'enterprise'", "'director'"],
    ["'starter'", "'mid'"],
    ["'pro'", "'senior'"],
    ["'free'", "'junior'"],
    // Event types → entry types
    ["'login'", "'clock_in'"],
    ["'feature_used'", "'meeting'"],
    ["'export'", "'code_review'"],
    ["'api_call'", "'deploy'"],
    ["'upgrade_prompt_shown'", "'standup'"],
    // Categories
    ["'analytics'", "'engineering'"],
    ["'integrations'", "'marketing'"],
    ["'storage'", "'operations'"],
    ["'support'", "'support'"],
  ],
  prose: [
    ["SaaS company", "technology company"],
    ["SaaS product", "corporate operations system"],
    ["SaaS", "TechCorp"],
    ["a user", "an employee"],
    ["the user", "the employee"],
    ["each user", "each employee"],
    ["All users", "All employees"],
    ["all users", "all employees"],
    ["Users", "Employees"],
    ["users who", "employees who"],
    ["which users", "which employees"],
    ["Find users", "Find employees"],
    ["buyer", "employee"],
    ["product", "project"],
    ["products", "projects"],
    ["subscription", "assignment"],
    ["subscriptions", "assignments"],
    ["order line item", "expense line item"],
    ["order", "expense report"],
    ["orders", "expense reports"],
    ["events", "timesheet entries"],
    ["revenue", "expenditure"],
    ["the CEO", "the VP of Operations"],
    ["signed up", "was hired"],
    ["sign up", "get hired"],
    ["churned", "terminated"],
    ["churn", "termination"],
  ],
  phaseOverrides: {
    "phase-0": {
      description: "Learn SQL from scratch \u2014 query the TechCorp HR database with SELECT, WHERE, ORDER BY, and GROUP BY.",
    },
    "phase-1": {
      description: "Combine employee, project, and expense data using different types of joins.",
    },
    "phase-2": {
      description: "Use queries inside queries to solve complex HR & operations problems.",
    },
  },
};

const professionalPhases = mapPhases(seriousTheme.phases, professionalMapping);
const professionalCapstones = mapCapstones(seriousTheme.capstones, professionalMapping);
const professionalScenarios = mapScenarios(ALL_SCENARIOS, professionalMapping);

export const professionalTheme: ThemeDefinition = {
  id: "professional",
  name: "TechCorp HR & Operations",
  tagline: "Manage employees, projects, and expenses \u2014 real-world corporate analytics.",
  icon: "\uD83C\uDFE2",
  dbSchema: "theme_professional",
  schemaReference: PROFESSIONAL_SCHEMA_REFERENCE,
  phases: professionalPhases,
  capstones: professionalCapstones,
  scenarios: professionalScenarios,
};
