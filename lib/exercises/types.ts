export type Difficulty = "beginner" | "intermediate" | "advanced";

export type PhaseId =
  | "phase-0"
  | "phase-1"
  | "phase-2"
  | "phase-3"
  | "phase-4"
  | "phase-5"
  | "phase-6"
  | "phase-7"
  | "phase-8"
  | "capstone";

export type ExerciseMode = "worked-example" | "scaffolded" | "open" | "quiz" | "debug";

export interface Hint {
  readonly level: 1 | 2 | 3;
  readonly text: string;
}

/** One option in a multiple-choice quiz exercise.
 *  isCorrect is safe to send to the client — this is a training tool, not a high-stakes exam. */
export interface QuizOption {
  readonly id: string;         // "a" | "b" | "c" | "d"
  readonly text: string;
  readonly isCorrect: boolean;
}

/** A variation of an exercise unlocked after viewing the solution.
 *  expectedSql must NEVER be sent to the client. */
export interface ExerciseVariation {
  readonly description: string;  // replacement markdown description
  readonly starterSql?: string;  // optional replacement starter SQL
  readonly expectedSql: string;  // server-side only — stripped by toClientExercise()
}

/** Variation data safe to send to the client (expectedSql stripped) */
export interface ClientExerciseVariation {
  readonly description: string;
  readonly starterSql?: string;
  // expectedSql intentionally absent
}

export interface Exercise {
  readonly id: string;
  readonly phase: PhaseId;
  readonly order: number;
  readonly title: string;
  readonly concept: string;
  readonly mode: ExerciseMode;
  readonly difficulty: Difficulty;
  readonly description: string;
  readonly starterSql?: string;
  readonly expectedSql: string;
  readonly explanation: string;
  readonly hints: readonly Hint[];
  readonly tags: readonly string[];
  readonly skipValidation?: boolean;
  readonly quizOptions?: readonly QuizOption[];   // only for mode === "quiz"
  readonly variation?: ExerciseVariation;          // optional; unlocked after viewing solution
  readonly bugDescription?: string;                // only for mode === "debug" — explains the bug after solving
}

export interface Phase {
  readonly id: PhaseId;
  readonly title: string;
  readonly description: string;
  readonly exercises: readonly Exercise[];
}

/** Exercise data safe to send to the client.
 *  Use toClientExercise() from lib/exercises/sanitize.ts — do NOT manually destructure.
 *
 *  WARNING: allPhases is passed to client components as Phase[] which still contains
 *  Exercise objects with expectedSql. Components reading from allPhases (e.g. CoursePanel)
 *  must only access safe fields: id, title, mode, phase, order, concept, difficulty.
 */
export type ClientExercise = Omit<Exercise, "expectedSql" | "variation"> & {
  readonly quizOptions?: readonly QuizOption[];
  readonly variation?: ClientExerciseVariation;
};

// ---------------------------------------------------------------------------
// Gamification types
// ---------------------------------------------------------------------------

export type BadgeId =
  | "first-query"
  | "phase-0-complete"
  | "phase-1-complete"
  | "phase-2-complete"
  | "phase-3-complete"
  | "phase-4-complete"
  | "phase-5-complete"
  | "phase-6-complete"
  | "phase-7-complete"
  | "phase-8-complete"
  | "quiz-master"
  | "independence"
  | "streak-7"
  | "full-curriculum"
  | "certified"
  | "scenario-master";

export interface Badge {
  readonly id: BadgeId;
  readonly name: string;
  readonly description: string;
  readonly icon: string; // emoji
}

export type Level =
  | "Novice"
  | "Apprentice"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master";

// ---------------------------------------------------------------------------
// Capstone types
// ---------------------------------------------------------------------------

export interface CapstoneProject {
  readonly id: string; // e.g. "capstone-sales-dashboard"
  readonly title: string;
  readonly description: string; // scenario narrative (markdown)
  readonly exercises: readonly Exercise[];
  readonly requiredPhases: readonly PhaseId[]; // must complete these first
}
