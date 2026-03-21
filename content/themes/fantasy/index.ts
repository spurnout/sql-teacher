import type { ThemeDefinition } from "../types";
import type { ThemeMapping } from "../shared/mapper";
import { mapPhases, mapCapstones, mapScenarios } from "../shared/mapper";
import { seriousTheme } from "../serious";
import { FANTASY_SCHEMA_REFERENCE } from "./schema";
import { ALL_SCENARIOS } from "@/content/scenarios";

/**
 * Fantasy theme mapping: Kingdom of Eldoria
 *
 * Tables:  users→adventurers, products→artifacts, subscriptions→enrollments,
 *          orders→quests, order_items→quest_loot, events→tavern_logs
 */
const fantasyMapping: ThemeMapping = {
  tables: [
    ["order_items", "quest_loot"],
    ["subscriptions", "enrollments"],
    ["orders", "quests"],
    ["products", "artifacts"],
    ["events", "tavern_logs"],
    ["users", "adventurers"],
  ],
  columns: [
    ["unit_price_cents", "appraisal_gold"],
    ["price_cents", "value_gold"],
    ["total_cents", "reward_gold"],
    ["mrr_cents", "upkeep_gold"],
    ["product_id", "artifact_id"],
    ["user_id", "adventurer_id"],
    ["order_id", "quest_id"],
    ["started_at", "acquired_at"],
    ["cancelled_at", "lost_at"],
    ["churned_at", "exiled_at"],
    ["email", "title"],
    ["plan", "class"],
    ["country", "kingdom"],
    // event_type stays the same for tavern_logs
    // occurred_at stays the same for tavern_logs
  ],
  values: [
    // Plan → class values
    ["'enterprise'", "'paladin'"],
    ["'starter'", "'mage'"],
    ["'pro'", "'ranger'"],
    ["'free'", "'warrior'"],
    // Event types → tavern events
    ["'login'", "'brawl'"],
    ["'feature_used'", "'feast'"],
    ["'export'", "'quest_rumor'"],
    ["'api_call'", "'merchant_visit'"],
    ["'upgrade_prompt_shown'", "'training'"],
    // Categories → artifact types
    ["'analytics'", "'weapon'"],
    ["'integrations'", "'armor'"],
    ["'storage'", "'potion'"],
    ["'support'", "'scroll'"],
  ],
  prose: [
    ["SaaS company", "kingdom of Eldoria"],
    ["SaaS product", "the kingdom's guild hall database"],
    ["SaaS", "Eldoria"],
    ["a user", "an adventurer"],
    ["the user", "the adventurer"],
    ["each user", "each adventurer"],
    ["All users", "All adventurers"],
    ["all users", "all adventurers"],
    ["Users", "Adventurers"],
    ["users who", "adventurers who"],
    ["which users", "which adventurers"],
    ["Find users", "Find adventurers"],
    ["buyer", "adventurer"],
    ["product", "artifact"],
    ["products", "artifacts"],
    ["subscription", "enrollment"],
    ["subscriptions", "enrollments"],
    ["order line item", "quest loot item"],
    ["order", "quest"],
    ["orders", "quests"],
    ["events", "tavern logs"],
    ["revenue", "gold earned"],
    ["dollars", "gold"],
    ["cents", "gold pieces"],
    ["the CEO", "the Guild Master"],
    ["signed up", "joined the guild"],
    ["sign up", "join the guild"],
    ["churned", "been exiled"],
    ["churn", "exile"],
  ],
  phaseOverrides: {
    "phase-0": {
      description: "Learn SQL from scratch \u2014 query the Eldoria guild hall database with SELECT, WHERE, ORDER BY, and GROUP BY.",
    },
    "phase-1": {
      description: "Combine adventurer, artifact, and quest data using different types of joins.",
    },
    "phase-2": {
      description: "Use queries inside queries to solve complex kingdom mysteries.",
    },
  },
};

const fantasyPhases = mapPhases(seriousTheme.phases, fantasyMapping);
const fantasyCapstones = mapCapstones(seriousTheme.capstones, fantasyMapping);
const fantasyScenarios = mapScenarios(ALL_SCENARIOS, fantasyMapping);

export const fantasyTheme: ThemeDefinition = {
  id: "fantasy",
  name: "Kingdom of Eldoria",
  tagline: "Swords, spells, and SQL \u2014 query the guild hall of an epic fantasy kingdom!",
  icon: "\u2694\uFE0F",
  dbSchema: "theme_fantasy",
  schemaReference: FANTASY_SCHEMA_REFERENCE,
  phases: fantasyPhases,
  capstones: fantasyCapstones,
  scenarios: fantasyScenarios,
};
