import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import type { GolfRecord } from "@/lib/challenges/types";

export const runtime = "nodejs";

/**
 * GET — Get all golf records for the current user.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT exercise_id, char_count, user_sql, achieved_at
     FROM sql_golf_records
     WHERE user_id = $1
     ORDER BY achieved_at DESC`,
    [user.id]
  );

  const records: GolfRecord[] = result.rows.map(
    (r: Record<string, unknown>) => ({
      exerciseId: r.exercise_id as string,
      charCount: r.char_count as number,
      userSql: r.user_sql as string,
      achievedAt: (r.achieved_at as Date).toISOString(),
    })
  );

  return NextResponse.json({ records });
}

/**
 * POST — Submit a golf record. Only saves if it's a new personal best.
 * Body: { exerciseId: string, charCount: number, userSql: string }
 *
 * Awards 10 XP per new personal best.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { exerciseId?: unknown; charCount?: unknown; userSql?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { exerciseId, charCount, userSql } = body;
  if (
    typeof exerciseId !== "string" ||
    exerciseId.length === 0 ||
    exerciseId.length > 200 ||
    typeof charCount !== "number" ||
    charCount < 1 ||
    typeof userSql !== "string" ||
    userSql.length === 0
  ) {
    return NextResponse.json(
      { error: "exerciseId (string), charCount (number), and userSql (string) are required." },
      { status: 400 }
    );
  }

  const pool = getAdminPool();

  // Upsert: only update if new char_count is lower
  const result = await pool.query(
    `INSERT INTO sql_golf_records (user_id, exercise_id, char_count, user_sql)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, exercise_id)
     DO UPDATE SET char_count = EXCLUDED.char_count,
                   user_sql = EXCLUDED.user_sql,
                   achieved_at = NOW()
     WHERE sql_golf_records.char_count > EXCLUDED.char_count
     RETURNING char_count`,
    [user.id, exerciseId, charCount, userSql]
  );

  const isNewBest = result.rowCount !== null && result.rowCount > 0;

  // Award XP for new personal best
  if (isNewBest) {
    await pool.query(
      `INSERT INTO user_xp_events (user_id, exercise_id, xp_amount, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, exercise_id, reason) DO NOTHING`,
      [user.id, exerciseId, 10, "golf-personal-best"]
    );
  }

  return NextResponse.json({ isNewBest, charCount });
}
