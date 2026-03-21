import { NextRequest, NextResponse } from "next/server";
import { validateQuery } from "@/lib/db/security";
import { getThemedExercise } from "@/lib/exercises/loader";
import { getCurrentUser } from "@/lib/auth/session";
import { validateWithThemeSchema } from "@/lib/db/sandbox";
import { getThemeDbSchema } from "@/content/themes";
import { recordAttempt } from "@/lib/adaptive/queries";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    exerciseId?: string;
    phase?: string;
    userSql?: string;
    useVariation?: boolean;
    hintsUsed?: number;
    timeSpentMs?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { exerciseId, phase, userSql, useVariation, hintsUsed, timeSpentMs } = body;

  if (
    typeof exerciseId !== "string" ||
    exerciseId.length > 200 ||
    typeof phase !== "string" ||
    typeof userSql !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: exerciseId, phase, userSql." },
      { status: 400 }
    );
  }

  // Get user's theme for loading correct exercise content
  const user = await getCurrentUser();
  const themeId = user?.theme ?? "serious";
  const themeSchema = getThemeDbSchema(themeId);
  if (!themeSchema) {
    return NextResponse.json(
      { error: "Invalid theme configuration." },
      { status: 400 }
    );
  }

  const exercise = getThemedExercise(themeId, phase, exerciseId);
  if (!exercise) {
    return NextResponse.json(
      { error: "Exercise not found." },
      { status: 404 }
    );
  }

  if (exercise.skipValidation) {
    return NextResponse.json({ passed: true, skipped: true });
  }

  // Determine the target SQL to compare against.
  const targetSql =
    useVariation && exercise.variation
      ? exercise.variation.expectedSql
      : exercise.expectedSql;

  const userValidation = validateQuery(userSql);
  if (!userValidation.valid) {
    return NextResponse.json(
      { passed: false, error: userValidation.reason },
      { status: 400 }
    );
  }

  const userTrimmed = userSql.trim().replace(/;+\s*$/, "");
  const expectedTrimmed = targetSql.trim().replace(/;+\s*$/, "");

  const equivalenceQuery = `
    SELECT COUNT(*) AS diff_count FROM (
      (SELECT * FROM (${userTrimmed}) AS user_q
       EXCEPT
       SELECT * FROM (${expectedTrimmed}) AS expected_q)
      UNION ALL
      (SELECT * FROM (${expectedTrimmed}) AS expected_q2
       EXCEPT
       SELECT * FROM (${userTrimmed}) AS user_q2)
    ) AS differences
  `;

  try {
    const result = await validateWithThemeSchema(themeSchema, equivalenceQuery);
    const diffCount = parseInt(result.rows[0]?.diff_count, 10);
    if (Number.isNaN(diffCount)) {
      return NextResponse.json(
        { error: "Validation query returned unexpected result" },
        { status: 500 }
      );
    }
    const passed = diffCount === 0;

    // Record attempt for adaptive learning (fire-and-forget — never block response)
    if (user) {
      recordAttempt({
        userId: user.id,
        exerciseId,
        passed,
        hintsUsed: hintsUsed ?? 0,
        timeSpentMs: timeSpentMs ?? null,
        userSql,
      }).catch(() => {
        /* best-effort — don't fail validation if tracking fails */
      });
    }

    return NextResponse.json({ passed, diffCount });
  } catch (err: unknown) {
    // Record failed attempt (syntax/runtime error counts as a failed attempt)
    if (user) {
      recordAttempt({
        userId: user.id,
        exerciseId,
        passed: false,
        hintsUsed: hintsUsed ?? 0,
        timeSpentMs: timeSpentMs ?? null,
        userSql,
      }).catch(() => {
        /* best-effort */
      });
    }

    const rawMessage =
      err instanceof Error ? err.message : "";
    const isSyntaxError = rawMessage.toLowerCase().includes("syntax");
    const message = isSyntaxError
      ? "Your query has a syntax error. Please check and try again."
      : "Validation failed. Please check your query and try again.";
    return NextResponse.json(
      { passed: false, error: message },
      { status: 422 }
    );
  }
}
