import type { Scenario } from "./types";
import { ALL_SCENARIOS, getScenario as getRawScenario } from "@/content/scenarios";
import type { ThemeId } from "@/content/themes/types";
import { getTheme } from "@/content/themes";

// ---------------------------------------------------------------------------
// Loader functions — theme-aware
// ---------------------------------------------------------------------------

export function getAllScenarios(): readonly Scenario[] {
  return ALL_SCENARIOS;
}

export function getScenario(id: string): Scenario | undefined {
  return getRawScenario(id);
}

/**
 * Get all scenarios for a given theme (pre-mapped content).
 * Falls back to raw scenarios if theme not found.
 */
export function getThemedScenarios(themeId: ThemeId): readonly Scenario[] {
  const theme = getTheme(themeId);
  return theme?.scenarios ?? ALL_SCENARIOS;
}

/**
 * Get a single scenario with theme-mapped content.
 */
export function getThemedScenario(
  themeId: ThemeId,
  scenarioId: string
): Scenario | undefined {
  return getThemedScenarios(themeId).find((s) => s.id === scenarioId);
}

/**
 * Get a specific step's expectedSql for validation (theme-aware).
 */
export function getThemedStepExpectedSql(
  themeId: ThemeId,
  scenarioId: string,
  stepIndex: number
): string | undefined {
  const scenario = getThemedScenario(themeId, scenarioId);
  if (!scenario) return undefined;
  const step = scenario.steps.find((s) => s.stepIndex === stepIndex);
  return step?.expectedSql;
}
