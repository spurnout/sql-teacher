import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";

/** GET /api/history — list user's query history */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const rawOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Math.min(Number.isNaN(rawLimit) ? 50 : Math.max(rawLimit, 1), 200);
  const offset = Math.min(Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0), 100_000);
  const bookmarkedOnly = url.searchParams.get("bookmarked") === "true";
  const search = url.searchParams.get("search") ?? null;
  const exerciseId = url.searchParams.get("exerciseId") ?? null;

  const pool = getAdminPool();

  let query = `SELECT id, sql_text, exercise_id, success, row_count, duration_ms, bookmarked, executed_at
               FROM query_history WHERE user_id = $1`;
  const params: (string | number | boolean)[] = [user.id];
  let paramIndex = 2;

  if (bookmarkedOnly) {
    query += ` AND bookmarked = true`;
  }

  if (search) {
    // Escape ILIKE special characters to prevent wildcard injection
    const escapedSearch = search.replace(/[%_\\]/g, "\\$&");
    query += ` AND sql_text ILIKE $${paramIndex}`;
    params.push(`%${escapedSearch}%`);
    paramIndex++;
  }

  if (exerciseId) {
    query += ` AND exercise_id = $${paramIndex}`;
    params.push(exerciseId);
    paramIndex++;
  }

  query += ` ORDER BY executed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const entries = result.rows.map((r) => ({
    id: r.id as number,
    sqlText: r.sql_text as string,
    exerciseId: (r.exercise_id as string) ?? null,
    success: r.success as boolean,
    rowCount: r.row_count as number,
    durationMs: r.duration_ms as number,
    bookmarked: r.bookmarked as boolean,
    executedAt: r.executed_at as string,
  }));

  return NextResponse.json({ entries });
}

/** PATCH /api/history — toggle bookmark */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: unknown; bookmarked?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, bookmarked } = body;
  if (typeof id !== "number" || typeof bookmarked !== "boolean") {
    return NextResponse.json(
      { error: "id and bookmarked required" },
      { status: 400 }
    );
  }

  const pool = getAdminPool();
  await pool.query(
    `UPDATE query_history SET bookmarked = $1 WHERE id = $2 AND user_id = $3`,
    [bookmarked, id, user.id]
  );

  return NextResponse.json({ ok: true });
}
