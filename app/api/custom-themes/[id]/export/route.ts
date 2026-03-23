import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { getCustomThemeExercises } from "@/lib/themes/exercise-queries";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/custom-themes/[id]/export
 *
 * Export a custom theme bundle as a JSON download.
 * Includes metadata, schema reference, and exercises.
 * Excludes schema_sql and seed_sql (too large).
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const themeId = parseInt(id, 10);
  if (Number.isNaN(themeId)) {
    return NextResponse.json({ error: "Invalid theme ID" }, { status: 400 });
  }

  const pool = getAdminPool();
  const themeResult = await pool.query(
    `SELECT slug, name, description, schema_ref, source_dialect
     FROM custom_themes WHERE id = $1`,
    [themeId]
  );

  if (themeResult.rows.length === 0) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  // Auth: admin or org member
  if (!user.isAdmin) {
    const memberCheck = await pool.query(
      `SELECT 1 FROM custom_themes ct
       JOIN org_members om ON om.org_id = ct.org_id
       WHERE ct.id = $1 AND om.user_id = $2`,
      [themeId, user.id]
    );
    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const theme = themeResult.rows[0];
  const exercises = await getCustomThemeExercises(themeId);

  const bundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: {
      slug: theme.slug,
      name: theme.name,
      description: theme.description,
      schemaRef: theme.schema_ref,
      sourceDialect: theme.source_dialect,
    },
    exercises,
  };

  const json = JSON.stringify(bundle, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="theme-${theme.slug}.json"`,
    },
  });
}
