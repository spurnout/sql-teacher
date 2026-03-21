/**
 * Exercise theme mapper — transforms serious-theme exercises into themed versions.
 *
 * Each theme defines table/column/value mappings. The mapper applies these
 * to SQL strings and description text, producing complete Exercise objects
 * with themed content while preserving IDs, phases, modes, and pedagogy.
 */
import type {
  Exercise,
  ExerciseVariation,
  Hint,
  Phase,
  CapstoneProject,
} from "@/lib/exercises/types";
import type { Scenario, ScenarioStep } from "@/lib/scenarios/types";

// ─── Mapping Config ─────────────────────────────────────────────────────────

export interface ThemeMapping {
  /** Table name replacements (order matters — longer names first to avoid partial matches) */
  readonly tables: ReadonlyArray<readonly [from: string, to: string]>;

  /** Column name replacements (applied after table renames) */
  readonly columns: ReadonlyArray<readonly [from: string, to: string]>;

  /**
   * Value replacements — domain-specific values in SQL and descriptions.
   * Applied after table/column renames. Order matters (longer first).
   */
  readonly values: ReadonlyArray<readonly [from: string, to: string]>;

  /**
   * Description text replacements — narrative/domain terms.
   * Applied to description, explanation, and hint text only (not SQL).
   */
  readonly prose: ReadonlyArray<readonly [from: string | RegExp, to: string]>;

  /**
   * Phase title/description overrides keyed by phase ID.
   * Only the provided fields are replaced.
   */
  readonly phaseOverrides?: Readonly<
    Record<string, { readonly title?: string; readonly description?: string }>
  >;
}

// ─── Core replacement helpers ───────────────────────────────────────────────

function applySqlReplacements(sql: string, mapping: ThemeMapping): string {
  let result = sql;

  // Apply table renames (word-boundary aware to avoid partial matches)
  for (const [from, to] of mapping.tables) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  // Apply column renames
  for (const [from, to] of mapping.columns) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  // Apply value renames (e.g. 'pro' → 'ravenous')
  for (const [from, to] of mapping.values) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  return result;
}

function applyProseReplacements(text: string, mapping: ThemeMapping): string {
  let result = text;

  // Apply table renames in prose
  for (const [from, to] of mapping.tables) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  // Apply column renames in prose
  for (const [from, to] of mapping.columns) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  // Apply value renames in prose
  for (const [from, to] of mapping.values) {
    result = result.replace(new RegExp(`\\b${escapeRegex(from)}\\b`, "g"), to);
  }

  // Apply prose-only replacements (narrative terms)
  for (const [from, to] of mapping.prose) {
    if (typeof from === "string") {
      result = result.replace(new RegExp(escapeRegex(from), "gi"), to);
    } else {
      result = result.replace(from, to);
    }
  }

  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Exercise mapping ───────────────────────────────────────────────────────

function mapHint(hint: Hint, mapping: ThemeMapping): Hint {
  return {
    ...hint,
    text: applyProseReplacements(hint.text, mapping),
  };
}

function mapVariation(
  variation: ExerciseVariation,
  mapping: ThemeMapping
): ExerciseVariation {
  return {
    description: applyProseReplacements(variation.description, mapping),
    starterSql: variation.starterSql
      ? applySqlReplacements(variation.starterSql, mapping)
      : undefined,
    expectedSql: applySqlReplacements(variation.expectedSql, mapping),
  };
}

export function mapExercise(
  exercise: Exercise,
  mapping: ThemeMapping
): Exercise {
  return {
    ...exercise,
    description: applyProseReplacements(exercise.description, mapping),
    starterSql: exercise.starterSql
      ? applySqlReplacements(exercise.starterSql, mapping)
      : undefined,
    expectedSql: exercise.expectedSql
      ? applySqlReplacements(exercise.expectedSql, mapping)
      : exercise.expectedSql,
    explanation: applyProseReplacements(exercise.explanation, mapping),
    hints: exercise.hints.map((h) => mapHint(h, mapping)),
    variation: exercise.variation
      ? mapVariation(exercise.variation, mapping)
      : undefined,
    bugDescription: exercise.bugDescription
      ? applyProseReplacements(exercise.bugDescription, mapping)
      : undefined,
    // Quiz options stay unchanged — they test SQL concepts, not domain knowledge
  };
}

export function mapPhase(phase: Phase, mapping: ThemeMapping): Phase {
  const override = mapping.phaseOverrides?.[phase.id];
  return {
    id: phase.id,
    title: override?.title ?? phase.title,
    description: override?.description ?? phase.description,
    exercises: phase.exercises.map((e) => mapExercise(e, mapping)),
  };
}

export function mapCapstone(
  capstone: CapstoneProject,
  mapping: ThemeMapping
): CapstoneProject {
  return {
    ...capstone,
    description: applyProseReplacements(capstone.description, mapping),
    exercises: capstone.exercises.map((e) => mapExercise(e, mapping)),
  };
}

export function mapPhases(
  phases: readonly Phase[],
  mapping: ThemeMapping
): readonly Phase[] {
  return phases.map((p) => mapPhase(p, mapping));
}

export function mapCapstones(
  capstones: readonly CapstoneProject[],
  mapping: ThemeMapping
): readonly CapstoneProject[] {
  return capstones.map((c) => mapCapstone(c, mapping));
}

// ─── Scenario mapping ────────────────────────────────────────────────────────

export function mapScenarioStep(
  step: ScenarioStep,
  mapping: ThemeMapping
): ScenarioStep {
  return {
    ...step,
    description: applyProseReplacements(step.description, mapping),
    expectedSql: applySqlReplacements(step.expectedSql, mapping),
    starterSql: step.starterSql
      ? applySqlReplacements(step.starterSql, mapping)
      : undefined,
    explanation: applyProseReplacements(step.explanation, mapping),
    contextFromPreviousStep: step.contextFromPreviousStep
      ? applyProseReplacements(step.contextFromPreviousStep, mapping)
      : undefined,
    hints: step.hints.map((h) => mapHint(h, mapping)),
  };
}

export function mapScenario(
  scenario: Scenario,
  mapping: ThemeMapping
): Scenario {
  return {
    ...scenario,
    narrative: applyProseReplacements(scenario.narrative, mapping),
    steps: scenario.steps.map((s) => mapScenarioStep(s, mapping)),
  };
}

export function mapScenarios(
  scenarios: readonly Scenario[],
  mapping: ThemeMapping
): readonly Scenario[] {
  return scenarios.map((s) => mapScenario(s, mapping));
}
