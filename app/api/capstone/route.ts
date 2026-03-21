import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { ALL_CAPSTONES } from "@/content/capstones";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT capstone_id, started_at, completed_at FROM user_capstone_progress WHERE user_id = $1`,
    [user.id]
  );

  const progress: Record<
    string,
    { startedAt: string; completedAt: string | null }
  > = {};
  for (const row of result.rows) {
    progress[row.capstone_id] = {
      startedAt: row.started_at,
      completedAt: row.completed_at ?? null,
    };
  }

  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { capstoneId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { capstoneId, action } = body;
  if (typeof capstoneId !== "string" || typeof action !== "string") {
    return NextResponse.json(
      { error: "capstoneId and action required" },
      { status: 400 }
    );
  }

  const capstone = ALL_CAPSTONES.find((c) => c.id === capstoneId);
  if (!capstone) {
    return NextResponse.json(
      { error: "Capstone not found" },
      { status: 404 }
    );
  }

  const pool = getAdminPool();

  if (action === "complete") {
    // Verify all exercises in this capstone are actually complete
    const progressResult = await pool.query(
      `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
      [user.id]
    );
    const completedIds = new Set(
      progressResult.rows.map((r) => r.exercise_id as string)
    );
    const allDone = capstone.exercises.every((e) => completedIds.has(e.id));

    if (!allDone) {
      return NextResponse.json(
        { error: "Not all exercises completed" },
        { status: 400 }
      );
    }

    const updateResult = await pool.query(
      `UPDATE user_capstone_progress
       SET completed_at = NOW()
       WHERE user_id = $1 AND capstone_id = $2 AND completed_at IS NULL
       RETURNING capstone_id`,
      [user.id, capstoneId]
    );

    if (updateResult.rows.length === 0) {
      // Row may not exist yet (direct API call) or already completed — upsert fallback
      await pool.query(
        `INSERT INTO user_capstone_progress (user_id, capstone_id, completed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, capstone_id)
         DO UPDATE SET completed_at = COALESCE(user_capstone_progress.completed_at, NOW())`,
        [user.id, capstoneId]
      );
    }

    return NextResponse.json({ ok: true, completed: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
