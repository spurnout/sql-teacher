import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import {
  getCustomThemeExercises,
  upsertCustomThemeExercise,
  deleteCustomThemeExercise,
} from "@/lib/themes/exercise-queries";
import { validateExerciseJson } from "@/lib/themes/exercise-validator";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Verify the custom theme exists and belongs to the caller's org (or caller is admin) */
async function authorizeTheme(
  themeId: number,
  userId: number,
  isAdmin: boolean
): Promise<{ authorized: boolean; error?: string }> {
  if (isAdmin) return { authorized: true };

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT ct.id
     FROM custom_themes ct
     JOIN org_members om ON om.org_id = ct.org_id
     WHERE ct.id = $1 AND om.user_id = $2 AND om.role IN ('owner', 'manager')`,
    [themeId, userId]
  );
  if (result.rows.length === 0) {
    return { authorized: false, error: "Theme not found or insufficient permissions" };
  }
  return { authorized: true };
}

/**
 * GET /api/custom-themes/[id]/exercises
 * List all exercises for a custom theme.
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

  const auth = await authorizeTheme(themeId, user.id, user.isAdmin);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const exercises = await getCustomThemeExercises(themeId);
  return NextResponse.json({ exercises, count: exercises.length });
}

/**
 * POST /api/custom-themes/[id]/exercises
 * Upsert a single exercise.
 * Body: { exercise: Exercise }
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

  const auth = await authorizeTheme(themeId, user.id, user.isAdmin);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  let body: { exercise?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validateExerciseJson(body.exercise);
  if (!result.valid) {
    return NextResponse.json(
      { error: "Invalid exercise", details: result.errors },
      { status: 400 }
    );
  }

  await upsertCustomThemeExercise(themeId, result.exercise);
  return NextResponse.json({ success: true, exerciseId: result.exercise.id });
}

/**
 * DELETE /api/custom-themes/[id]/exercises?exerciseId=xxx
 * Delete a single exercise.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const themeId = parseInt(id, 10);
  if (Number.isNaN(themeId)) {
    return NextResponse.json({ error: "Invalid theme ID" }, { status: 400 });
  }

  const auth = await authorizeTheme(themeId, user.id, user.isAdmin);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const exerciseId = req.nextUrl.searchParams.get("exerciseId");
  if (!exerciseId) {
    return NextResponse.json(
      { error: "Missing exerciseId query parameter" },
      { status: 400 }
    );
  }

  const deleted = await deleteCustomThemeExercise(themeId, exerciseId);
  return NextResponse.json({ success: true, deleted });
}
