import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { selectDailyChallenge, getCurrentPhase } from "@/lib/challenges/algorithm";
import { toClientExercise } from "@/lib/exercises/sanitize";

/** GET /api/challenges — get today's daily challenge */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getAdminPool();
  const today = new Date().toISOString().split("T")[0];

  // Check if we already have a challenge for today
  const existingResult = await pool.query(
    `SELECT exercise_id, completed_at FROM daily_challenges
     WHERE user_id = $1 AND challenge_date = $2`,
    [user.id, today]
  );

  const progressResult = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedIds = new Set(
    progressResult.rows.map((r) => r.exercise_id as string)
  );

  // Use existing challenge or select a new one
  let exerciseId: string;
  let isCompleted = false;

  if (existingResult.rows.length > 0) {
    exerciseId = existingResult.rows[0].exercise_id as string;
    isCompleted = existingResult.rows[0].completed_at !== null;
  } else {
    const currentPhase = getCurrentPhase(completedIds);
    const exercise = selectDailyChallenge(completedIds, currentPhase, today);

    if (!exercise) {
      return NextResponse.json({ challenge: null });
    }

    exerciseId = exercise.id;

    // Store the challenge
    await pool.query(
      `INSERT INTO daily_challenges (user_id, challenge_date, exercise_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, challenge_date) DO NOTHING`,
      [user.id, today, exerciseId]
    );
  }

  // Find the exercise details
  const { ALL_PHASES } = await import("@/lib/exercises/loader");
  let challengeExercise = null;
  for (const phase of ALL_PHASES) {
    const found = phase.exercises.find((e) => e.id === exerciseId);
    if (found) {
      challengeExercise = toClientExercise(found);
      break;
    }
  }

  return NextResponse.json({
    challenge: challengeExercise
      ? {
          exercise: challengeExercise,
          date: today,
          completed: isCompleted,
        }
      : null,
  });
}

/** POST /api/challenges — mark today's challenge as complete */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getAdminPool();
  const today = new Date().toISOString().split("T")[0];

  const result = await pool.query(
    `UPDATE daily_challenges SET completed_at = NOW()
     WHERE user_id = $1 AND challenge_date = $2 AND completed_at IS NULL
     RETURNING id`,
    [user.id, today]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ ok: false, message: "No active challenge found" });
  }

  return NextResponse.json({ ok: true });
}
