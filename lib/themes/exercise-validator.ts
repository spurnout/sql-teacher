/**
 * Runtime validation for Exercise JSON objects.
 *
 * Used by import APIs and seed scripts to validate exercise data
 * before inserting into custom_theme_exercises.
 */
import type {
  Exercise,
  ExerciseMode,
  Difficulty,
  PhaseId,
  Hint,
} from "@/lib/exercises/types";

const VALID_PHASES: ReadonlySet<string> = new Set<PhaseId>([
  "phase-0", "phase-1", "phase-2", "phase-3", "phase-4",
  "phase-5", "phase-6", "phase-7", "phase-8", "capstone",
]);

const VALID_MODES: ReadonlySet<string> = new Set<ExerciseMode>([
  "worked-example", "scaffolded", "open", "quiz", "debug",
]);

const VALID_DIFFICULTIES: ReadonlySet<string> = new Set<Difficulty>([
  "beginner", "intermediate", "advanced",
]);

type ValidationResult =
  | { readonly valid: true; readonly exercise: Exercise }
  | { readonly valid: false; readonly errors: readonly string[] };

/**
 * Validate an unknown value as an Exercise JSON object.
 * Returns the typed Exercise on success, or a list of errors on failure.
 */
export function validateExerciseJson(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { valid: false, errors: ["Expected an object"] };
  }

  const o = obj as Record<string, unknown>;

  // Required string fields
  const requiredStrings: readonly (keyof Exercise & string)[] = [
    "id", "title", "concept", "description", "expectedSql", "explanation",
  ];
  for (const field of requiredStrings) {
    if (typeof o[field] !== "string" || (o[field] as string).length === 0) {
      errors.push(`Missing or empty required string field: ${field}`);
    }
  }

  // phase
  if (typeof o.phase !== "string" || !VALID_PHASES.has(o.phase)) {
    errors.push(
      `Invalid phase: ${String(o.phase)}. Must be one of: ${[...VALID_PHASES].join(", ")}`
    );
  }

  // order
  if (typeof o.order !== "number" || !Number.isInteger(o.order) || o.order < 0) {
    errors.push(`Invalid order: must be a non-negative integer`);
  }

  // mode
  if (typeof o.mode !== "string" || !VALID_MODES.has(o.mode)) {
    errors.push(
      `Invalid mode: ${String(o.mode)}. Must be one of: ${[...VALID_MODES].join(", ")}`
    );
  }

  // difficulty
  if (typeof o.difficulty !== "string" || !VALID_DIFFICULTIES.has(o.difficulty)) {
    errors.push(
      `Invalid difficulty: ${String(o.difficulty)}. Must be one of: ${[...VALID_DIFFICULTIES].join(", ")}`
    );
  }

  // hints — array of { level: 1|2|3, text: string }
  if (!Array.isArray(o.hints)) {
    errors.push("hints must be an array");
  } else {
    for (let i = 0; i < o.hints.length; i++) {
      const h = o.hints[i] as Record<string, unknown>;
      if (
        typeof h !== "object" ||
        h === null ||
        typeof h.level !== "number" ||
        ![1, 2, 3].includes(h.level) ||
        typeof h.text !== "string"
      ) {
        errors.push(`hints[${i}] is invalid — must have level (1|2|3) and text (string)`);
      }
    }
  }

  // tags — array of strings
  if (!Array.isArray(o.tags)) {
    errors.push("tags must be an array");
  } else {
    for (let i = 0; i < o.tags.length; i++) {
      if (typeof o.tags[i] !== "string") {
        errors.push(`tags[${i}] must be a string`);
      }
    }
  }

  // Optional fields — just type check if present
  if (o.starterSql !== undefined && typeof o.starterSql !== "string") {
    errors.push("starterSql must be a string if provided");
  }
  if (o.skipValidation !== undefined && typeof o.skipValidation !== "boolean") {
    errors.push("skipValidation must be a boolean if provided");
  }
  if (o.bugDescription !== undefined && typeof o.bugDescription !== "string") {
    errors.push("bugDescription must be a string if provided");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Cast is safe — we've validated all required fields
  return { valid: true, exercise: o as unknown as Exercise };
}

/**
 * Validate an array of exercise objects.
 * Returns all valid exercises and a list of errors for invalid ones.
 */
export function validateExerciseArray(
  arr: unknown
): {
  readonly exercises: readonly Exercise[];
  readonly errors: readonly string[];
} {
  if (!Array.isArray(arr)) {
    return { exercises: [], errors: ["Expected an array of exercises"] };
  }

  const exercises: Exercise[] = [];
  const errors: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    const result = validateExerciseJson(arr[i]);
    if (result.valid) {
      exercises.push(result.exercise);
    } else {
      errors.push(
        `Exercise[${i}] (id: ${(arr[i] as Record<string, unknown>)?.id ?? "unknown"}): ${result.errors.join("; ")}`
      );
    }
  }

  return { exercises, errors };
}
