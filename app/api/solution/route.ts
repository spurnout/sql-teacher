import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { getExercise } from "@/lib/exercises/loader";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { exerciseId?: string; phase?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { exerciseId, phase } = body;
  if (typeof exerciseId !== "string" || exerciseId.length > 200 || typeof phase !== "string") {
    return NextResponse.json(
      { error: "Missing required fields: exerciseId, phase." },
      { status: 400 }
    );
  }

  const exercise = getExercise(phase, exerciseId);
  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  // Record that this user viewed the solution (idempotent)
  const pool = getAdminPool();
  try {
    await pool.query(
      `INSERT INTO user_solution_views (user_id, exercise_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, exercise_id) DO NOTHING`,
      [user.id, exerciseId]
    );
  } catch {
    // Non-fatal — proceed even if recording fails
  }

  // Build the response. Strip variation.expectedSql from the client payload.
  const response: {
    solutionSql: string;
    variation?: { description: string; starterSql?: string };
  } = {
    solutionSql: exercise.expectedSql,
  };

  if (exercise.variation) {
    response.variation = {
      description: exercise.variation.description,
      ...(exercise.variation.starterSql
        ? { starterSql: exercise.variation.starterSql }
        : {}),
    };
    // NOTE: exercise.variation.expectedSql is intentionally NOT included here.
    // The validate endpoint uses useVariation: true to look it up server-side.
  }

  return NextResponse.json(response);
}
