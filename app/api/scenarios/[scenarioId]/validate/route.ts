import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedStepExpectedSql } from "@/lib/scenarios/loader";
import { validateQuery } from "@/lib/db/security";
import { validateWithThemeSchema } from "@/lib/db/sandbox";
import { getThemeDbSchema } from "@/content/themes";
import {
  recordStepCompletion,
  completeScenario,
  startScenario,
  getScenarioProgress,
} from "@/lib/scenarios/queries";
import { getThemedScenario } from "@/lib/scenarios/loader";
import { getAdminPool } from "@/lib/db/pool";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ scenarioId: string }>;
}

/**
 * POST /api/scenarios/:scenarioId/validate — validate a step
 *
 * Body: { stepIndex: number, userSql: string }
 *
 * Uses EXCEPT-based equivalence check (same as /api/validate).
 * Records step completion and awards XP.
 * On final step completion, marks scenario as complete and awards bonus XP.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  const { scenarioId } = await params;

  let body: { stepIndex?: number; userSql?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { stepIndex, userSql } = body;

  if (typeof stepIndex !== "number" || typeof userSql !== "string") {
    return NextResponse.json(
      { error: "Missing required fields: stepIndex, userSql." },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themeId = user.theme;
  const themeSchema = getThemeDbSchema(themeId);
  if (!themeSchema) {
    return NextResponse.json(
      { error: "Invalid theme configuration." },
      { status: 400 }
    );
  }

  // Load the full scenario to verify step count and ordering
  const scenario = getThemedScenario(themeId, scenarioId);
  if (!scenario) {
    return NextResponse.json(
      { error: "Scenario not found." },
      { status: 404 }
    );
  }

  const totalSteps = scenario.steps.length;
  if (stepIndex < 0 || stepIndex >= totalSteps) {
    return NextResponse.json(
      { error: "Invalid step index." },
      { status: 400 }
    );
  }

  // Server-side step ordering enforcement: step N requires steps 0..N-1 complete
  if (stepIndex > 0) {
    const progress = await getScenarioProgress(user.id, scenarioId);
    const completedSteps = new Set(progress?.stepsCompleted ?? []);
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(i)) {
        return NextResponse.json(
          { error: "Previous steps must be completed first." },
          { status: 400 }
        );
      }
    }
  }

  const expectedSql = getThemedStepExpectedSql(themeId, scenarioId, stepIndex);
  if (!expectedSql) {
    return NextResponse.json(
      { error: "Step not found." },
      { status: 404 }
    );
  }

  // Validate user SQL for security
  const userValidation = validateQuery(userSql);
  if (!userValidation.valid) {
    return NextResponse.json(
      { passed: false, error: userValidation.reason },
      { status: 400 }
    );
  }

  const userTrimmed = userSql.trim().replace(/;+\s*$/, "");
  const expectedTrimmed = expectedSql.trim().replace(/;+\s*$/, "");

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
        { error: "Validation returned unexpected result." },
        { status: 500 }
      );
    }

    const passed = diffCount === 0;

    if (passed) {
      // Ensure scenario is started
      await startScenario(user.id, scenarioId);

      // Record step completion
      const { isNew } = await recordStepCompletion(
        user.id,
        scenarioId,
        stepIndex,
        userSql
      );

      const isLastStep = stepIndex === totalSteps - 1;
      let scenarioCompleted = false;
      let xpAwarded = 0;
      const exerciseKey = `scenario:${scenarioId}:step:${stepIndex}`;

      if (isNew) {
        // Award per-step XP (25 XP per step)
        const pool = getAdminPool();
        await pool.query(
          `INSERT INTO user_xp_events (user_id, exercise_id, xp_amount, reason)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, exercise_id, reason) DO NOTHING`,
          [user.id, exerciseKey, 25, "scenario-step"]
        );
        xpAwarded = 25;

        if (isLastStep) {
          const { isNew: isNewCompletion } = await completeScenario(
            user.id,
            scenarioId
          );
          if (isNewCompletion) {
            // Award scenario completion bonus (100 XP)
            const completionKey = `scenario:${scenarioId}:completion`;
            await pool.query(
              `INSERT INTO user_xp_events (user_id, exercise_id, xp_amount, reason)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id, exercise_id, reason) DO NOTHING`,
              [user.id, completionKey, 100, "scenario-completion"]
            );
            xpAwarded += 100;
            scenarioCompleted = true;
          }
        }
      }

      return NextResponse.json({
        passed: true,
        isNew,
        xpAwarded,
        scenarioCompleted,
      });
    }

    return NextResponse.json({ passed: false, diffCount });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "";
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
