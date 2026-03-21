import type { SchemaReference } from "@/content/schema/reference";

export const PROFESSIONAL_SCHEMA_REFERENCE: SchemaReference = {
  tables: [
    {
      name: "employees",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "email", type: "text", note: "unique" },
        { name: "role", type: "text", note: "junior|mid|senior|director" },
        { name: "department", type: "text" },
        { name: "created_at", type: "timestamptz" },
        { name: "terminated_at", type: "timestamptz", note: "nullable" },
      ],
    },
    {
      name: "projects",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "category", type: "text", note: "engineering|marketing|operations|support" },
        { name: "budget_cents", type: "integer" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "assignments",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "employee_id", type: "integer", note: "FK\u2192employees" },
        { name: "project_id", type: "integer", note: "FK\u2192projects" },
        { name: "status", type: "text", note: "active|cancelled|past_due|trialing" },
        { name: "started_at", type: "timestamptz" },
        { name: "ended_at", type: "timestamptz", note: "nullable" },
        { name: "hourly_rate", type: "integer" },
      ],
    },
    {
      name: "expenses",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "employee_id", type: "integer", note: "FK\u2192employees" },
        { name: "total_cents", type: "integer" },
        { name: "status", type: "text", note: "completed|refunded|pending" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "expense_items",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "expense_id", type: "integer", note: "FK\u2192expenses" },
        { name: "project_id", type: "integer", note: "FK\u2192projects" },
        { name: "quantity", type: "integer" },
        { name: "unit_cost_cents", type: "integer" },
      ],
    },
    {
      name: "timesheet_entries",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "employee_id", type: "integer", note: "FK\u2192employees" },
        { name: "entry_type", type: "text", note: "clock_in|meeting|code_review|deploy|standup" },
        { name: "properties", type: "jsonb", note: "nullable" },
        { name: "logged_at", type: "timestamptz" },
      ],
    },
  ],
};
