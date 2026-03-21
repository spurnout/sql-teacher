import type { Difficulty, Hint, PhaseId } from "@/lib/exercises/types";

// ---------------------------------------------------------------------------
// Scenario step
// ---------------------------------------------------------------------------

export interface ScenarioStep {
  readonly stepIndex: number;
  readonly title: string;
  readonly description: string; // markdown — the task for this step
  readonly expectedSql: string; // server-side only
  readonly starterSql?: string;
  readonly hints: readonly Hint[];
  readonly explanation: string;
  readonly contextFromPreviousStep?: string; // markdown — context bridging from prior step
  readonly tags: readonly string[];
  readonly difficulty: Difficulty;
}

/** Step data safe to send to the client (expectedSql stripped) */
export interface ClientScenarioStep {
  readonly stepIndex: number;
  readonly title: string;
  readonly description: string;
  readonly starterSql?: string;
  readonly hints: readonly Hint[];
  readonly explanation: string;
  readonly contextFromPreviousStep?: string;
  readonly tags: readonly string[];
  readonly difficulty: Difficulty;
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

export interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly narrative: string; // markdown — the scenario intro/story
  readonly steps: readonly ScenarioStep[];
  readonly requiredPhases: readonly PhaseId[]; // phases the user must complete first
  readonly concept: string; // primary concept tested
  readonly difficulty: Difficulty;
}

/** Scenario data safe to send to the client (expectedSql stripped from steps) */
export interface ClientScenario {
  readonly id: string;
  readonly title: string;
  readonly narrative: string;
  readonly steps: readonly ClientScenarioStep[];
  readonly requiredPhases: readonly PhaseId[];
  readonly concept: string;
  readonly difficulty: Difficulty;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface ScenarioProgress {
  readonly scenarioId: string;
  readonly currentStep: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly stepsCompleted: readonly number[]; // step indices that are done
}
