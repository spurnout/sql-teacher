import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomThemeBySlug } from "@/lib/themes/queries";
import { bulkUpsertExercises } from "@/lib/themes/exercise-queries";
import { validateExerciseArray } from "@/lib/themes/exercise-validator";

export const runtime = "nodejs";

/**
 * POST /api/custom-themes/import-bundle
 *
 * Import a full theme bundle (exercises only — theme must already exist by slug).
 * Body: { version: 1, theme: { slug }, exercises: Exercise[] }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract slug from bundle
  const theme = body.theme as Record<string, unknown> | undefined;
  const slug = theme?.slug;
  if (typeof slug !== "string" || slug.length === 0) {
    return NextResponse.json(
      { error: "Missing theme.slug in bundle" },
      { status: 400 }
    );
  }

  // Find existing theme
  const existingTheme = await getCustomThemeBySlug(slug);
  if (!existingTheme) {
    return NextResponse.json(
      {
        error: `Theme with slug "${slug}" not found. Import the SQL dump first via /api/custom-themes/import, then import the exercise bundle.`,
      },
      { status: 404 }
    );
  }

  // Validate and insert exercises
  const rawExercises = body.exercises;
  if (!Array.isArray(rawExercises)) {
    return NextResponse.json(
      { error: "Missing exercises array in bundle" },
      { status: 400 }
    );
  }

  const { exercises, errors } = validateExerciseArray(rawExercises);

  if (exercises.length === 0) {
    return NextResponse.json(
      {
        error: "No valid exercises found in bundle",
        validationErrors: errors,
      },
      { status: 400 }
    );
  }

  const inserted = await bulkUpsertExercises(existingTheme.id, exercises);

  return NextResponse.json({
    success: true,
    themeId: existingTheme.id,
    slug: existingTheme.slug,
    imported: inserted,
    skipped: errors.length,
    validationErrors: errors.length > 0 ? errors : undefined,
  });
}
