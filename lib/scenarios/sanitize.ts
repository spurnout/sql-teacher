import type {
  Scenario,
  ClientScenario,
  ScenarioStep,
  ClientScenarioStep,
} from "./types";

/**
 * Strips expectedSql from each step before sending to the client.
 * Always use this instead of manual destructuring.
 */
export function toClientScenarioStep(step: ScenarioStep): ClientScenarioStep {
  const { expectedSql: _expected, ...rest } = step;
  return rest;
}

export function toClientScenario(scenario: Scenario): ClientScenario {
  return {
    ...scenario,
    steps: scenario.steps.map(toClientScenarioStep),
  };
}
