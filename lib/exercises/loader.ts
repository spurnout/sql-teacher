import type { Exercise, Phase, PhaseId, CapstoneProject } from "./types";
import type { ThemeId } from "@/content/themes/types";
import { isCustomThemeId } from "@/content/themes/types";
import { getTheme } from "@/content/themes";
import type { SchemaReference } from "@/content/schema/reference";
import { getCustomThemeBySlug } from "@/lib/themes/queries";
import { getCustomThemeExercises } from "@/lib/themes/exercise-queries";

// Re-export for backward compat — serious theme phases
import { seriousTheme } from "@/content/themes/serious";

export const ALL_PHASES: readonly Phase[] = seriousTheme.phases;

/** Standard phase titles — used when grouping custom theme exercises into phases */
const PHASE_TITLES: Record<PhaseId, { title: string; description: string }> = {
  "phase-0": { title: "SQL Fundamentals", description: "Learn SQL from scratch — SELECT, WHERE, ORDER BY, aggregations, and GROUP BY." },
  "phase-1": { title: "JOIN Mastery", description: "Combine data from multiple tables using different types of joins." },
  "phase-2": { title: "Subqueries", description: "Use queries inside queries to solve complex problems." },
  "phase-3": { title: "CTEs", description: "Write readable, reusable query building blocks with WITH clauses." },
  "phase-4": { title: "Window Functions", description: "Perform calculations across rows without collapsing results." },
  "phase-5": { title: "Query Optimization", description: "Understand and improve query performance with EXPLAIN ANALYZE." },
  "phase-6": { title: "Essential SQL Patterns", description: "Master CASE WHEN, COALESCE, string/date functions, set operations, and JSONB queries." },
  "phase-7": { title: "DML & DDL Concepts", description: "Learn CREATE TABLE, INSERT, UPDATE, DELETE, constraints, and data types." },
  "phase-8": { title: "Database Administration", description: "Indexes, views, transactions, VACUUM, GRANT/REVOKE, and system monitoring." },
  "capstone": { title: "Capstone Projects", description: "Apply everything you've learned in realistic scenarios." },
};

// ---------------------------------------------------------------------------
// Theme-aware loaders
// ---------------------------------------------------------------------------

/** Get all phases for a given theme */
export function getThemedPhases(themeId: ThemeId): readonly Phase[] {
  const theme = getTheme(themeId);
  if (!theme) return ALL_PHASES; // fallback to serious
  return theme.phases;
}

/** Get a single phase for a given theme */
export function getThemedPhase(
  themeId: ThemeId,
  phaseId: string
): Phase | undefined {
  return getThemedPhases(themeId).find((p) => p.id === phaseId);
}

/** Get a single exercise for a given theme */
export function getThemedExercise(
  themeId: ThemeId,
  phaseId: string,
  exerciseId: string
): Exercise | undefined {
  if (phaseId === "capstone") {
    const theme = getTheme(themeId);
    const capstones = theme?.capstones ?? seriousTheme.capstones;
    for (const capstone of capstones) {
      const ex = capstone.exercises.find((e) => e.id === exerciseId);
      if (ex) return ex;
    }
    return undefined;
  }
  const phase = getThemedPhase(themeId, phaseId);
  if (!phase) return undefined;
  return phase.exercises.find((e) => e.id === exerciseId);
}

/** Get capstone projects for a given theme */
export function getThemedCapstones(themeId: ThemeId): readonly CapstoneProject[] {
  const theme = getTheme(themeId);
  return theme?.capstones ?? seriousTheme.capstones;
}

/** Find any exercise by ID within a theme */
export function findThemedExerciseById(
  themeId: ThemeId,
  exerciseId: string
): Exercise | undefined {
  const phases = getThemedPhases(themeId);
  for (const phase of phases) {
    const ex = phase.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  const capstones = getThemedCapstones(themeId);
  for (const capstone of capstones) {
    const ex = capstone.exercises.find((e) => e.id === exerciseId);
    if (ex) return ex;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Async loaders — support custom themes stored in the database
// ---------------------------------------------------------------------------

/** Extract slug from a custom theme ID (e.g., "custom-cresql" → "cresql") */
function slugFromCustomThemeId(themeId: string): string {
  return themeId.replace(/^custom-/, "");
}

/** Group flat exercise list into Phase objects, sorted by phase then order. */
function groupExercisesIntoPhases(
  exercises: readonly Exercise[]
): readonly Phase[] {
  const phaseMap = new Map<PhaseId, Exercise[]>();

  for (const ex of exercises) {
    const existing = phaseMap.get(ex.phase);
    if (existing) {
      existing.push(ex);
    } else {
      phaseMap.set(ex.phase, [ex]);
    }
  }

  // Sort exercises within each phase by order
  for (const exList of phaseMap.values()) {
    exList.sort((a, b) => a.order - b.order);
  }

  // Build Phase objects in standard phase order
  const phases: Phase[] = [];
  const phaseOrder: PhaseId[] = [
    "phase-0", "phase-1", "phase-2", "phase-3", "phase-4",
    "phase-5", "phase-6", "phase-7", "phase-8",
  ];

  for (const phaseId of phaseOrder) {
    const exList = phaseMap.get(phaseId);
    if (!exList || exList.length === 0) continue;
    const meta = PHASE_TITLES[phaseId] ?? {
      title: phaseId,
      description: "",
    };
    phases.push({
      id: phaseId,
      title: meta.title,
      description: meta.description,
      exercises: exList,
    });
  }

  return phases;
}

/**
 * Async version of getThemedPhases — loads from DB for custom themes.
 * Builtin themes delegate to the sync version (no DB call).
 */
export async function getThemedPhasesAsync(
  themeId: ThemeId
): Promise<readonly Phase[]> {
  // Builtin themes: fast path, no DB
  if (!isCustomThemeId(themeId)) {
    return getThemedPhases(themeId);
  }

  const slug = slugFromCustomThemeId(themeId);
  const theme = await getCustomThemeBySlug(slug);
  if (!theme || theme.status !== "provisioned") return [];

  const exercises = await getCustomThemeExercises(theme.id);
  if (exercises.length === 0) return [];

  return groupExercisesIntoPhases(exercises);
}

/**
 * Async version of getThemedExercise — loads from DB for custom themes.
 */
export async function getThemedExerciseAsync(
  themeId: ThemeId,
  phaseId: string,
  exerciseId: string
): Promise<Exercise | undefined> {
  // Builtin themes: fast path
  if (!isCustomThemeId(themeId)) {
    return getThemedExercise(themeId, phaseId, exerciseId);
  }

  const slug = slugFromCustomThemeId(themeId);
  const theme = await getCustomThemeBySlug(slug);
  if (!theme || theme.status !== "provisioned") return undefined;

  const exercises = await getCustomThemeExercises(theme.id);
  return exercises.find(
    (e) => e.phase === phaseId && e.id === exerciseId
  );
}

/**
 * Load schema reference for a custom theme from the DB.
 * Returns undefined for builtin themes (use getTheme().schemaReference instead).
 */
export async function getCustomThemeSchemaRef(
  themeId: ThemeId
): Promise<SchemaReference | undefined> {
  if (!isCustomThemeId(themeId)) return undefined;

  const slug = slugFromCustomThemeId(themeId);
  const theme = await getCustomThemeBySlug(slug);
  if (!theme) return undefined;

  return theme.schema_ref;
}

/**
 * Async version of getThemedAdjacentExercises.
 */
export async function getThemedAdjacentExercisesAsync(
  themeId: ThemeId,
  exerciseId: string
): Promise<{ prev: Exercise | null; next: Exercise | null; phaseId: PhaseId | null }> {
  if (!isCustomThemeId(themeId)) {
    return getThemedAdjacentExercises(themeId, exerciseId);
  }

  const phases = await getThemedPhasesAsync(themeId);
  const allExercises = phases.flatMap((p) =>
    p.exercises.map((e) => ({ exercise: e, phaseId: p.id }))
  );
  const currentIndex = allExercises.findIndex(
    (e) => e.exercise.id === exerciseId
  );

  if (currentIndex === -1) {
    return { prev: null, next: null, phaseId: null };
  }

  return {
    prev: currentIndex > 0 ? allExercises[currentIndex - 1].exercise : null,
    next:
      currentIndex < allExercises.length - 1
        ? allExercises[currentIndex + 1].exercise
        : null,
    phaseId: allExercises[currentIndex].phaseId,
  };
}

/** Get adjacent exercises within a theme */
export function getThemedAdjacentExercises(
  themeId: ThemeId,
  exerciseId: string
): { prev: Exercise | null; next: Exercise | null; phaseId: PhaseId | null } {
  const phases = getThemedPhases(themeId);
  const allExercises = phases.flatMap((p) =>
    p.exercises.map((e) => ({ exercise: e, phaseId: p.id }))
  );
  const currentIndex = allExercises.findIndex(
    (e) => e.exercise.id === exerciseId
  );

  if (currentIndex === -1) {
    return { prev: null, next: null, phaseId: null };
  }

  return {
    prev: currentIndex > 0 ? allExercises[currentIndex - 1].exercise : null,
    next:
      currentIndex < allExercises.length - 1
        ? allExercises[currentIndex + 1].exercise
        : null,
    phaseId: allExercises[currentIndex].phaseId,
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible functions (default to serious theme)
// ---------------------------------------------------------------------------

export function getPhase(phaseId: string): Phase | undefined {
  return ALL_PHASES.find((p) => p.id === phaseId);
}

export function getExercise(
  phaseId: string,
  exerciseId: string
): Exercise | undefined {
  return getThemedExercise("serious", phaseId, exerciseId);
}

export function findExerciseById(exerciseId: string): Exercise | undefined {
  return findThemedExerciseById("serious", exerciseId);
}

export function getPhaseExercises(phaseId: string): readonly Exercise[] {
  return getPhase(phaseId)?.exercises ?? [];
}

export function getAdjacentExercises(
  exerciseId: string
): { prev: Exercise | null; next: Exercise | null; phaseId: PhaseId | null } {
  return getThemedAdjacentExercises("serious", exerciseId);
}
