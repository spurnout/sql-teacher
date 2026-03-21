import type { ThemeDefinition } from "../types";
import type { ThemeMapping } from "../shared/mapper";
import { mapPhases, mapCapstones, mapScenarios } from "../shared/mapper";
import { seriousTheme } from "../serious";
import { SCIFI_SCHEMA_REFERENCE } from "./schema";
import { ALL_SCENARIOS } from "@/content/scenarios";

/**
 * Sci-Fi theme mapping: Starfleet Command Database
 *
 * Tables:  users→crew_members, products→starships, subscriptions→deployments,
 *          orders→missions, order_items→mission_objectives, events→sensor_logs
 */
const scifiMapping: ThemeMapping = {
  tables: [
    ["order_items", "mission_objectives"],
    ["subscriptions", "deployments"],
    ["orders", "missions"],
    ["products", "starships"],
    ["events", "sensor_logs"],
    ["users", "crew_members"],
  ],
  columns: [
    ["unit_price_cents", "bounty_credits"],
    ["price_cents", "cost_credits"],
    ["total_cents", "reward_credits"],
    ["mrr_cents", "daily_pay"],
    ["product_id", "starship_id"],
    ["user_id", "crew_id"],
    ["order_id", "mission_id"],
    ["event_type", "log_type"],
    ["cancelled_at", "ended_at"],
    ["churned_at", "discharged_at"],
    ["occurred_at", "recorded_at"],
    ["email", "callsign"],
    ["plan", "rank"],
    ["country", "homeworld"],
  ],
  values: [
    // Plan → rank values
    ["'enterprise'", "'captain'"],
    ["'starter'", "'lieutenant'"],
    ["'pro'", "'commander'"],
    ["'free'", "'ensign'"],
    // Event types → log types
    ["'login'", "'scan'"],
    ["'feature_used'", "'anomaly'"],
    ["'export'", "'combat'"],
    ["'api_call'", "'warp_jump'"],
    ["'upgrade_prompt_shown'", "'distress_signal'"],
    // Categories → ship classes
    ["'analytics'", "'fighter'"],
    ["'integrations'", "'cruiser'"],
    ["'storage'", "'freighter'"],
    ["'support'", "'dreadnought'"],
  ],
  prose: [
    ["SaaS company", "Starfleet Command"],
    ["SaaS product", "Starfleet operations database"],
    ["SaaS", "Starfleet"],
    ["a user", "a crew member"],
    ["the user", "the crew member"],
    ["each user", "each crew member"],
    ["All users", "All crew members"],
    ["all users", "all crew members"],
    ["Users", "Crew members"],
    ["users who", "crew members who"],
    ["which users", "which crew members"],
    ["Find users", "Find crew members"],
    ["buyer", "crew member"],
    ["product", "starship"],
    ["products", "starships"],
    ["subscription", "deployment"],
    ["subscriptions", "deployments"],
    ["order line item", "mission objective"],
    ["order", "mission"],
    ["orders", "missions"],
    ["events", "sensor logs"],
    ["revenue", "mission rewards"],
    ["dollars", "credits"],
    ["cents", "credits"],
    ["the CEO", "the Admiral"],
    ["signed up", "enlisted"],
    ["sign up", "enlist"],
    ["churned", "discharged"],
    ["churn", "discharge"],
  ],
  phaseOverrides: {
    "phase-0": {
      description: "Learn SQL from scratch \u2014 query the Starfleet database with SELECT, WHERE, ORDER BY, and GROUP BY.",
    },
    "phase-1": {
      description: "Combine crew, starship, and mission data using different types of joins.",
    },
    "phase-2": {
      description: "Use queries inside queries to solve complex Starfleet intelligence problems.",
    },
  },
};

const scifiPhases = mapPhases(seriousTheme.phases, scifiMapping);
const scifiCapstones = mapCapstones(seriousTheme.capstones, scifiMapping);
const scifiScenarios = mapScenarios(ALL_SCENARIOS, scifiMapping);

export const scifiTheme: ThemeDefinition = {
  id: "scifi",
  name: "Starfleet Command",
  tagline: "Command starships and crew across the galaxy \u2014 SQL for space explorers!",
  icon: "\uD83D\uDE80",
  dbSchema: "theme_scifi",
  schemaReference: SCIFI_SCHEMA_REFERENCE,
  phases: scifiPhases,
  capstones: scifiCapstones,
  scenarios: scifiScenarios,
};
