import type { ThemeDefinition } from "../types";
import type { ThemeMapping } from "../shared/mapper";
import { mapPhases, mapCapstones, mapScenarios } from "../shared/mapper";
import { seriousTheme } from "../serious";
import { SILLY_SCHEMA_REFERENCE } from "./schema";
import { ALL_SCENARIOS } from "@/content/scenarios";

/**
 * Silly theme mapping: Galactic Pizza Delivery
 *
 * Tables:  users→aliens, products→pizzas, events→incidents
 * Columns: email→species, plan→appetite_level, country→planet, etc.
 * Values:  pro→ravenous, completed→delivered, refunded→vaporized, etc.
 */
const sillyMapping: ThemeMapping = {
  // Order: longest/most specific first to avoid partial matches
  tables: [
    ["order_items", "order_items"],       // keep same
    ["subscriptions", "subscriptions"],   // keep same
    ["orders", "orders"],                 // keep same
    ["products", "pizzas"],
    ["events", "incidents"],
    ["users", "aliens"],
  ],
  columns: [
    // FK columns (more specific first)
    ["unit_price_cents", "unit_cost_credits"],
    ["price_cents", "cost_credits"],
    ["total_cents", "total_credits"],
    ["mrr_cents", "monthly_credits"],
    ["product_id", "pizza_id"],
    ["user_id", "alien_id"],
    ["event_type", "incident_type"],
    ["churned_at", "banned_at"],
    // Note: created_at stays as created_at on pizzas/orders — only aliens use registered_at
    // but since exercises reference created_at on the users table contextually,
    // we keep created_at as-is (the DB schema uses registered_at but exercises
    // reference the logical column; search_path handles the actual schema).
    // email → species swap
    ["email", "species"],
    ["plan", "appetite_level"],
    ["country", "planet"],
  ],
  values: [
    // Order statuses
    ["'completed'", "'delivered'"],
    ["'refunded'", "'vaporized'"],
    // Plan values
    ["'enterprise'", "'bottomless'"],
    ["'starter'", "'hungry'"],
    ["'pro'", "'ravenous'"],
    ["'free'", "'snacker'"],
    // Event types
    ["'login'", "'complaint'"],
    ["'feature_used'", "'abduction'"],
    ["'export'", "'food_fight'"],
    ["'api_call'", "'teleport_fail'"],
    ["'upgrade_prompt_shown'", "'tip'"],
    // Categories
    ["'analytics'", "'classic'"],
    ["'integrations'", "'exotic'"],
    ["'storage'", "'radioactive'"],
    ["'support'", "'void'"],
  ],
  prose: [
    ["SaaS company", "intergalactic pizza chain"],
    ["SaaS product", "galactic pizza delivery service"],
    ["SaaS", "Galactic Pizza"],
    ["a user", "an alien"],
    ["the user", "the alien"],
    ["each user", "each alien"],
    ["All users", "All aliens"],
    ["all users", "all aliens"],
    ["Users", "Aliens"],
    ["users who", "aliens who"],
    ["which users", "which aliens"],
    ["Find users", "Find aliens"],
    ["buyer", "alien customer"],
    ["product", "pizza"],
    ["products", "pizzas"],
    ["subscription", "pizza subscription"],
    ["order", "delivery order"],
    ["orders", "delivery orders"],
    ["events", "incidents"],
    ["revenue", "credits earned"],
    ["dollars", "credits"],
    ["cents", "credits"],
    ["the CEO", "the Galactic Pizza Overlord"],
    ["signed up", "registered"],
    ["sign up", "register"],
    ["churned", "banned"],
    ["churn", "ban"],
  ],
  phaseOverrides: {
    "phase-0": {
      description: "Learn SQL from scratch — query the galactic pizza database with SELECT, WHERE, ORDER BY, and GROUP BY.",
    },
    "phase-1": {
      description: "Combine alien, pizza, and delivery data using different types of joins.",
    },
    "phase-2": {
      description: "Use queries inside queries to solve complex galactic pizza problems.",
    },
  },
};

const sillyPhases = mapPhases(seriousTheme.phases, sillyMapping);
const sillyCapstones = mapCapstones(seriousTheme.capstones, sillyMapping);
const sillyScenarios = mapScenarios(ALL_SCENARIOS, sillyMapping);

export const sillyTheme: ThemeDefinition = {
  id: "silly",
  name: "Galactic Pizza Delivery",
  tagline: "Deliver pizzas to aliens across the galaxy \u2014 learn SQL with interstellar flavor!",
  icon: "\uD83C\uDF55",
  dbSchema: "theme_silly",
  schemaReference: SILLY_SCHEMA_REFERENCE,
  phases: sillyPhases,
  capstones: sillyCapstones,
  scenarios: sillyScenarios,
};
