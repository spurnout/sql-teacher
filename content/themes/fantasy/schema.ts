import type { SchemaReference } from "@/content/schema/reference";

export const FANTASY_SCHEMA_REFERENCE: SchemaReference = {
  tables: [
    {
      name: "adventurers",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "title", type: "text" },
        { name: "class", type: "text", note: "warrior|mage|ranger|paladin" },
        { name: "kingdom", type: "text" },
        { name: "created_at", type: "timestamptz" },
        { name: "exiled_at", type: "timestamptz", note: "nullable" },
      ],
    },
    {
      name: "artifacts",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "category", type: "text", note: "weapon|armor|potion|scroll" },
        { name: "value_gold", type: "integer" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "enrollments",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "adventurer_id", type: "integer", note: "FK\u2192adventurers" },
        { name: "artifact_id", type: "integer", note: "FK\u2192artifacts" },
        { name: "status", type: "text", note: "active|cancelled|past_due|trialing" },
        { name: "acquired_at", type: "timestamptz" },
        { name: "lost_at", type: "timestamptz", note: "nullable" },
        { name: "upkeep_gold", type: "integer" },
      ],
    },
    {
      name: "quests",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "adventurer_id", type: "integer", note: "FK\u2192adventurers" },
        { name: "reward_gold", type: "integer" },
        { name: "status", type: "text", note: "completed|refunded|pending" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "quest_loot",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "quest_id", type: "integer", note: "FK\u2192quests" },
        { name: "artifact_id", type: "integer", note: "FK\u2192artifacts" },
        { name: "quantity", type: "integer" },
        { name: "appraisal_gold", type: "integer" },
      ],
    },
    {
      name: "tavern_logs",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "adventurer_id", type: "integer", note: "FK\u2192adventurers" },
        { name: "event_type", type: "text", note: "brawl|feast|quest_rumor|merchant_visit|training" },
        { name: "properties", type: "jsonb", note: "nullable" },
        { name: "occurred_at", type: "timestamptz" },
      ],
    },
  ],
};
