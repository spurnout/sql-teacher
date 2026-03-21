import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES } from "@/lib/exercises/loader";
import type { Assessment, AssessmentResult, AssessmentAttempt } from "./types";

/** Fetch all assessments */
export async function getAllAssessments(): Promise<readonly Assessment[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, phase_id, assessment_type, title, time_limit_minutes, exercise_count
     FROM assessments ORDER BY phase_id, assessment_type`
  );

  return result.rows.map((r) => ({
    id: r.id as number,
    phaseId: r.phase_id as string,
    assessmentType: r.assessment_type as "entry" | "exit",
    title: r.title as string,
    timeLimitMinutes: r.time_limit_minutes as number,
    exerciseCount: r.exercise_count as number,
  }));
}

/** Fetch assessments for a specific phase */
export async function getPhaseAssessments(
  phaseId: string
): Promise<readonly Assessment[]> {
  const all = await getAllAssessments();
  return all.filter((a) => a.phaseId === phaseId);
}

/** Fetch user's assessment results */
export async function getUserAssessmentResults(
  userId: number
): Promise<readonly AssessmentResult[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, assessment_id, score_pct, exercises_passed, exercises_total, started_at, completed_at
     FROM assessment_results
     WHERE user_id = $1
     ORDER BY completed_at DESC`,
    [userId]
  );

  return result.rows.map((r) => ({
    id: r.id as number,
    assessmentId: r.assessment_id as number,
    scorePct: r.score_pct as number,
    exercisesPassed: r.exercises_passed as number,
    exercisesTotal: r.exercises_total as number,
    startedAt: r.started_at as string,
    completedAt: r.completed_at as string,
  }));
}

/** Start an assessment — select random exercises, persist attempt server-side */
export async function startAssessment(
  userId: number,
  assessment: Assessment
): Promise<AssessmentAttempt> {
  const phase = ALL_PHASES.find((p) => p.id === assessment.phaseId);
  if (!phase) {
    throw new Error(`Phase ${assessment.phaseId} not found`);
  }

  // Filter to non-quiz, non-worked-example exercises for assessments
  const eligibleExercises = phase.exercises.filter(
    (e) => e.mode === "open" || e.mode === "scaffolded"
  );

  // Shuffle and select
  const shuffled = [...eligibleExercises].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, assessment.exerciseCount);
  const exerciseIds = selected.map((e) => e.id);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + assessment.timeLimitMinutes * 60 * 1000
  );

  // Persist attempt to DB
  const pool = getAdminPool();
  const result = await pool.query(
    `INSERT INTO assessment_attempts (user_id, assessment_id, exercise_ids, started_at, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, assessment.id, exerciseIds, now.toISOString(), expiresAt.toISOString()]
  );

  const attemptId: number = result.rows[0].id;

  return {
    attemptId,
    assessment,
    exerciseIds,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/** Record a single exercise result within an assessment attempt.
 *  Verifies the attempt belongs to the given user before recording. */
export async function recordAssessmentExerciseResult(
  userId: number,
  attemptId: number,
  exerciseId: string,
  passed: boolean
): Promise<boolean> {
  const pool = getAdminPool();

  // Verify ownership and that attempt is still active
  const check = await pool.query(
    `SELECT 1 FROM assessment_attempts
     WHERE id = $1 AND user_id = $2 AND submitted = FALSE`,
    [attemptId, userId]
  );
  if (check.rows.length === 0) return false;

  await pool.query(
    `INSERT INTO assessment_exercise_results (attempt_id, exercise_id, passed)
     VALUES ($1, $2, $3)
     ON CONFLICT (attempt_id, exercise_id) DO UPDATE SET passed = $3, validated_at = NOW()`,
    [attemptId, exerciseId, passed]
  );
  return true;
}

/** Get an active (non-submitted) attempt for a user */
export async function getActiveAttempt(
  userId: number,
  assessmentId: number
): Promise<{ attemptId: number; exerciseIds: string[] } | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, exercise_ids FROM assessment_attempts
     WHERE user_id = $1 AND assessment_id = $2 AND submitted = FALSE
     ORDER BY started_at DESC LIMIT 1`,
    [userId, assessmentId]
  );
  if (result.rows.length === 0) return null;
  return {
    attemptId: result.rows[0].id as number,
    exerciseIds: result.rows[0].exercise_ids as string[],
  };
}

/** Submit an assessment — compute score from server-side exercise results */
export async function submitAssessment(
  userId: number,
  attemptId: number
): Promise<AssessmentResult> {
  const pool = getAdminPool();

  // Verify the attempt belongs to this user, is not submitted, and has not expired.
  // Allow a 30-second grace period for network latency on auto-submit.
  const attemptResult = await pool.query(
    `SELECT id, assessment_id, exercise_ids, started_at
     FROM assessment_attempts
     WHERE id = $1 AND user_id = $2 AND submitted = FALSE
       AND expires_at > NOW() - INTERVAL '30 seconds'`,
    [attemptId, userId]
  );

  if (attemptResult.rows.length === 0) {
    throw new Error("No active attempt found or time expired");
  }

  const attempt = attemptResult.rows[0];
  const exerciseIds: string[] = attempt.exercise_ids;
  const exercisesTotal = exerciseIds.length;

  // Count passed exercises from server-side records
  const passedResult = await pool.query(
    `SELECT COUNT(*)::int AS passed_count
     FROM assessment_exercise_results
     WHERE attempt_id = $1 AND passed = TRUE`,
    [attemptId]
  );
  const exercisesPassed: number = passedResult.rows[0].passed_count;
  const scorePct = exercisesTotal > 0
    ? Math.round((exercisesPassed / exercisesTotal) * 100)
    : 0;

  // Mark attempt as submitted
  await pool.query(
    `UPDATE assessment_attempts SET submitted = TRUE WHERE id = $1`,
    [attemptId]
  );

  // Record the final result
  const result = await pool.query(
    `INSERT INTO assessment_results (user_id, assessment_id, score_pct, exercises_passed, exercises_total, started_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, assessment_id, score_pct, exercises_passed, exercises_total, started_at, completed_at`,
    [userId, attempt.assessment_id, scorePct, exercisesPassed, exercisesTotal, attempt.started_at]
  );

  const r = result.rows[0];
  return {
    id: r.id as number,
    assessmentId: r.assessment_id as number,
    scorePct: r.score_pct as number,
    exercisesPassed: r.exercises_passed as number,
    exercisesTotal: r.exercises_total as number,
    startedAt: r.started_at as string,
    completedAt: r.completed_at as string,
  };
}
