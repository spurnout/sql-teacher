import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAllAssessments,
  getUserAssessmentResults,
  startAssessment,
  recordAssessmentExerciseResult,
  getActiveAttempt,
  submitAssessment,
} from "@/lib/assessments/queries";

/** GET /api/assessments — list all assessments with user's results */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [assessments, results] = await Promise.all([
    getAllAssessments(),
    getUserAssessmentResults(user.id),
  ]);

  return NextResponse.json({ assessments, results });
}

/** POST /api/assessments — start, validate-exercise, or submit an assessment */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Start a new assessment attempt
  if (body.action === "start") {
    const assessmentId = body.assessmentId;
    if (typeof assessmentId !== "number") {
      return NextResponse.json(
        { error: "assessmentId required" },
        { status: 400 }
      );
    }

    const assessments = await getAllAssessments();
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Resume existing active attempt if one exists (e.g. page refresh)
    const existing = await getActiveAttempt(user.id, assessmentId);
    if (existing) {
      return NextResponse.json({
        attempt: {
          attemptId: existing.attemptId,
          exerciseIds: existing.exerciseIds,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + assessment.timeLimitMinutes * 60 * 1000
          ).toISOString(),
        },
      });
    }

    const attempt = await startAssessment(user.id, assessment);
    return NextResponse.json({ attempt });
  }

  // Record a single exercise validation result (server-side)
  if (body.action === "validate-exercise") {
    const { attemptId, exerciseId, passed } = body;
    if (
      typeof attemptId !== "number" ||
      typeof exerciseId !== "string" ||
      typeof passed !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Missing required fields: attemptId, exerciseId, passed" },
        { status: 400 }
      );
    }

    try {
      const recorded = await recordAssessmentExerciseResult(user.id, attemptId, exerciseId, passed);
      if (!recorded) {
        return NextResponse.json(
          { error: "Attempt not found or already submitted" },
          { status: 403 }
        );
      }
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "Failed to record exercise result" },
        { status: 500 }
      );
    }
  }

  // Submit assessment — score computed server-side
  if (body.action === "submit") {
    const { attemptId } = body;
    if (typeof attemptId !== "number") {
      return NextResponse.json(
        { error: "attemptId required" },
        { status: 400 }
      );
    }

    try {
      const result = await submitAssessment(user.id, attemptId);
      return NextResponse.json({ ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submit failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
