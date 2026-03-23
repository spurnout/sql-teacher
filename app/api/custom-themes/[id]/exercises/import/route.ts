import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { bulkUpsertExercises } from "@/lib/themes/exercise-queries";
import { validateExerciseArray } from "@/lib/themes/exercise-validator";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/custom-themes/[id]/exercises/import
 *
 * Import exercises into an existing custom theme.
 * Accepts either:
 *   { exercises: Exercise[] }
 *   { version: 1, themeSlug: "...", exercises: Exercise[] }  (export format)
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const themeId = parseInt(id, 10);
  if (Number.isNaN(themeId)) {
    return NextResponse.json({ error: "Invalid theme ID" }, { status: 400 });
  }

  // Auth: admin or org owner/manager
  if (!user.isAdmin) {
    const pool = getAdminPool();
    const memberCheck = await pool.query(
      `SELECT 1 FROM custom_themes ct
       JOIN org_members om ON om.org_id = ct.org_id
       WHERE ct.id = $1 AND om.user_id = $2 AND om.role IN ('owner', 'manager')`,
      [themeId, user.id]
    );
    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract exercises array — support both raw and export bundle format
  const rawExercises = Array.isArray(body.exercises)
    ? body.exercises
    : body;

  const { exercises, errors } = validateExerciseArray(rawExercises);

  if (exercises.length === 0) {
    return NextResponse.json(
      {
        error: "No valid exercises found",
        validationErrors: errors,
      },
      { status: 400 }
    );
  }

  const inserted = await bulkUpsertExercises(themeId, exercises);

  return NextResponse.json({
    success: true,
    imported: inserted,
    skipped: errors.length,
    validationErrors: errors.length > 0 ? errors : undefined,
  });
}
