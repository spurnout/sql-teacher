import { NextRequest, NextResponse } from "next/server";
import { validateQuery } from "@/lib/db/security";
import { getCurrentUser } from "@/lib/auth/session";
import { executeWithThemeSchema } from "@/lib/db/sandbox";
import { getThemeDbSchema } from "@/content/themes";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { sql?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { sql } = body;
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

  // Get user's theme for schema routing
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const themeSchema = getThemeDbSchema(user.theme) ?? "theme_serious";

  try {
    // Use EXPLAIN without ANALYZE to avoid actually executing the query.
    // ANALYZE runs the query for real timing data, but introduces side-effect risk.
    const result = await executeWithThemeSchema(
      themeSchema,
      `EXPLAIN (FORMAT JSON) ${sql}`
    );

    // EXPLAIN returns a single row with a single column containing the JSON plan
    const plan = result.rows[0]?.["QUERY PLAN"] ?? result.rows[0]?.["query plan"] ?? null;

    if (!plan) {
      return NextResponse.json(
        { error: "Could not parse query plan." },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (err: unknown) {
    const rawMessage =
      err instanceof Error ? err.message : "Unknown database error";
    const message = rawMessage
      .replace(/\n\s*at .*/g, "")
      .substring(0, 500);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
