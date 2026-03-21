import type { SchemaReference } from "@/content/schema/reference";

export const SCIFI_SCHEMA_REFERENCE: SchemaReference = {
  tables: [
    {
      name: "crew_members",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "callsign", type: "text", note: "unique" },
        { name: "rank", type: "text", note: "ensign|lieutenant|commander|captain" },
        { name: "homeworld", type: "text" },
        { name: "created_at", type: "timestamptz" },
        { name: "discharged_at", type: "timestamptz", note: "nullable" },
      ],
    },
    {
      name: "starships",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "name", type: "text" },
        { name: "class", type: "text", note: "fighter|cruiser|freighter|dreadnought" },
        { name: "cost_credits", type: "integer" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "deployments",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "crew_id", type: "integer", note: "FK\u2192crew_members" },
        { name: "starship_id", type: "integer", note: "FK\u2192starships" },
        { name: "status", type: "text", note: "active|cancelled|past_due|trialing" },
        { name: "started_at", type: "timestamptz" },
        { name: "ended_at", type: "timestamptz", note: "nullable" },
        { name: "daily_pay", type: "integer" },
      ],
    },
    {
      name: "missions",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "crew_id", type: "integer", note: "FK\u2192crew_members" },
        { name: "reward_credits", type: "integer" },
        { name: "status", type: "text", note: "completed|refunded|pending" },
        { name: "created_at", type: "timestamptz" },
      ],
    },
    {
      name: "mission_objectives",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "mission_id", type: "integer", note: "FK\u2192missions" },
        { name: "starship_id", type: "integer", note: "FK\u2192starships" },
        { name: "quantity", type: "integer" },
        { name: "bounty_credits", type: "integer" },
      ],
    },
    {
      name: "sensor_logs",
      columns: [
        { name: "id", type: "serial", note: "PK" },
        { name: "crew_id", type: "integer", note: "FK\u2192crew_members" },
        { name: "log_type", type: "text", note: "scan|anomaly|combat|warp_jump|distress_signal" },
        { name: "properties", type: "jsonb", note: "nullable" },
        { name: "recorded_at", type: "timestamptz" },
      ],
    },
  ],
};
