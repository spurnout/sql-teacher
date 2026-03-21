import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { completeSpeedRunStep } from "@/lib/challenges/speed-run";
import { getAdminPool } from "@/lib/db/pool";

export const runtime = "nodejs";

/**
 * POST — Mark an exercise as completed in a speed run.
 * Body: { sessionId: number, exerciseId: string }
 *
 * Awards 50 XP on full session completion.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { sessionId?: unknown; exerciseId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sessionId, exerciseId } = body;
  if (typeof sessionId !== "number" || typeof exerciseId !== "string") {
    return NextResponse.json(
      { error: "sessionId (number) and exerciseId (string) are required." },
      { status: 400 }
    );
  }

  const session = await completeSpeedRunStep(user.id, sessionId, exerciseId);
  if (!session) {
    return NextResponse.json(
      { error: "Session not found, already completed, or exercise not in session." },
      { status: 404 }
    );
  }

  // Award XP on full completion (all exercises done within time limit)
  if (
    session.completedAt &&
    session.exercisesCompleted === session.exerciseIds.length
  ) {
    const pool = getAdminPool();
    await pool.query(
      `INSERT INTO user_xp_events (user_id, exercise_id, xp_amount, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, exercise_id, reason) DO NOTHING`,
      [user.id, `speed-run-${session.phaseId}`, 50, "speed-run-completion"]
    );
  }

  return NextResponse.json({ session });
}
