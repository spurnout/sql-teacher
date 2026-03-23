import { NextRequest, NextResponse } from "next/server";
import { getAdminPool } from "@/lib/db/pool";
import { getCurrentUser } from "@/lib/auth/session";
import { executeAdminQuery } from "@/lib/db/sandbox";
import { getThemeDbSchema } from "@/content/themes";

export const runtime = "nodejs";

/** Save query to history (fire-and-forget, non-blocking) */
function saveToHistory(
  userId: number,
  sqlText: string,
  success: boolean,
  rowCount: number,
  durationMs: number
): void {
  const pool = getAdminPool();
  pool
    .query(
      `INSERT INTO query_history (user_id, sql_text, exercise_id, success, row_count, duration_ms)
       VALUES ($1, $2, NULL, $3, $4, $5)`,
      [userId, sqlText.substring(0, 10000), success, rowCount, durationMs]
    )
    .catch((err: unknown) => {
      console.error(
        "[admin/execute saveToHistory] Failed:",
        err instanceof Error ? err.message : err
      );
    });
}

/**
 * POST /api/admin/execute
 *
 * Unrestricted SQL execution for admin users.
 * Supports SELECT, DML (INSERT/UPDATE/DELETE), and DDL (CREATE/ALTER/DROP).
 * No query validation or LIMIT wrapping is applied.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: { sql?: string; themeSchema?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sql, themeSchema } = body;

  if (typeof sql !== "string" || sql.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: sql" },
      { status: 400 }
    );
  }

  if (sql.length > 100_000) {
    return NextResponse.json(
      { error: "Query too long (max 100,000 characters)" },
      { status: 400 }
    );
  }

  // Determine schema — prefer explicit themeSchema, fall back to user's active theme
  const schema =
    typeof themeSchema === "string" && themeSchema.length > 0
      ? themeSchema
      : getThemeDbSchema(user.theme);

  if (!schema) {
    return NextResponse.json(
      { error: "Could not determine target schema" },
      { status: 400 }
    );
  }

  const start = performance.now();

  try {
    const result = await executeAdminQuery(schema, sql);
    const duration = Math.round(performance.now() - start);
    const command = result.command ?? "UNKNOWN";

    // Fire-and-forget history
    saveToHistory(user.id, sql, true, result.rowCount ?? 0, duration);

    // SELECT-like commands return rows
    if (
      command === "SELECT" ||
      command === "EXPLAIN" ||
      command === "TABLE" ||
      command === "VALUES" ||
      command === "SHOW"
    ) {
      return NextResponse.json({
        type: "select",
        rows: result.rows,
        fields: result.fields.map((f) => ({
          name: f.name,
          dataTypeID: f.dataTypeID,
        })),
        rowCount: result.rowCount ?? result.rows.length,
        duration,
      });
    }

    // DML/DDL commands
    return NextResponse.json({
      type: "command",
      command,
      rowCount: result.rowCount ?? 0,
      duration,
    });
  } catch (err: unknown) {
    const duration = Math.round(performance.now() - start);
    saveToHistory(user.id, sql, false, 0, duration);

    const rawMessage =
      err instanceof Error ? err.message : String(err);
    // Scrub stack traces, limit length
    const message = rawMessage
      .split("\n")[0]
      .substring(0, 500);

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
