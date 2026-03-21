import type { SchemaReference } from "@/content/schema/reference";

export const SILLY_SCHEMA_REFERENCE: SchemaReference = {
  tables: [
    {
      name: "aliens",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "species", type: "text" },
        { name: "appetite_level", type: "text", note: "snacker|hungry|ravenous|bottomless" },
        { name: "planet", type: "text" },
        { name: "created_at", type: "timestamptz" },
        { name: "banned_at", type: "timestamptz", note: "nullable" },
      ],
    },
    {
      name: "pizzas",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "category", type: "text", note: "classic|exotic|radioactive|void" },
        { name: "cost_credits", type: "integer" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "subscriptions",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "alien_id", type: "integer", note: "FK\u2192aliens" },
        { name: "pizza_id", type: "integer", note: "FK\u2192pizzas" },
        { name: "status", type: "text", note: "active|cancelled|past_due|trialing" },
        { name: "started_at", type: "timestamptz" },
        { name: "cancelled_at", type: "timestamptz", note: "nullable" },
        { name: "monthly_credits", type: "integer" },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "alien_id", type: "integer", note: "FK\u2192aliens" },
        { name: "total_credits", type: "integer" },
        { name: "status", type: "text", note: "delivered|vaporized|pending" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "order_items",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "order_id", type: "integer", note: "FK\u2192orders" },
        { name: "pizza_id", type: "integer", note: "FK\u2192pizzas" },
        { name: "quantity", type: "integer" },
        { name: "unit_cost_credits", type: "integer" },
      ],
    },
    {
      name: "incidents",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "alien_id", type: "integer", note: "FK\u2192aliens" },
        { name: "incident_type", type: "text", note: "complaint|abduction|food_fight|teleport_fail|tip" },
        { name: "properties", type: "jsonb", note: "nullable" },
        { name: "occurred_at", type: "timestamptz" },
      ],
    },
  ],
};
