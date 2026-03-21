import { NextRequest, NextResponse } from "next/server";
import { getAdminPool } from "@/lib/db/pool";
import { validateQuery, wrapWithLimit } from "@/lib/db/security";
import { getCurrentUser } from "@/lib/auth/session";
import { executeWithThemeSchema } from "@/lib/db/sandbox";
import { getThemeDbSchema } from "@/content/themes";

export const runtime = "nodejs";

/** Save query to history (fire-and-forget, non-blocking) */
function saveToHistory(
  userId: number,
  sqlText: string,
  exerciseId: string | null,
  success: boolean,
  rowCount: number,
  durationMs: number
): void {
  const pool = getAdminPool();
  pool
    .query(
      `INSERT INTO query_history (user_id, sql_text, exercise_id, success, row_count, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, sqlText.substring(0, 10000), exerciseId, success, rowCount, durationMs]
    )
    .catch((err: unknown) => {
      // Don't affect query execution, but log for observability
      console.error("[saveToHistory] Failed:", err instanceof Error ? err.message : err);
    });
}

export async function POST(req: NextRequest) {
  let body: { sql?: string; exerciseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sql, exerciseId } = body;
  if (typeof sql !== "string") {
    return NextResponse.json(
      { error: "Missing 'sql' field." },
      { status: 400 }
    );
  }

  const validation = validateQuery(sql);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  // Get user for history tracking and theme-based schema routing
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine the schema to query based on user's theme
  const themeSchema = getThemeDbSchema(user.theme);
  if (!themeSchema) {
    return NextResponse.json(
      { error: "Invalid theme configuration." },
      { status: 400 }
    );
  }

  const wrappedSql = wrapWithLimit(sql);

  const start = Date.now();
  try {
    const result = await executeWithThemeSchema(themeSchema, wrappedSql);
    const duration = Date.now() - start;
    const rowCount = result.rowCount ?? 0;

    // Save to history
    saveToHistory(user.id, sql, exerciseId ?? null, true, rowCount, duration);

    return NextResponse.json({
      rows: result.rows,
      rowCount,
      fields: result.fields.map((f) => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
      })),
      duration,
    });
  } catch (err: unknown) {
    const duration = Date.now() - start;

    // Save failed query to history
    saveToHistory(user.id, sql, exerciseId ?? null, false, 0, duration);

    // Return PostgreSQL error messages for learning purposes
    // (sandbox role prevents any destructive operations)
    const rawMessage =
      err instanceof Error ? err.message : "Unknown database error";
    // Strip internal details but keep the SQL error for learning
    const message = rawMessage
      .replace(/\n\s*at .*/g, "")
      .substring(0, 500);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
