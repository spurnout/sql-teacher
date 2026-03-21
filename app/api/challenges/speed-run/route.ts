import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  selectSpeedRunExercises,
  createSpeedRunSession,
  getActiveSession,
  getPersonalBests,
  abandonExpiredSessions,
} from "@/lib/challenges/speed-run";
import type { ThemeId } from "@/content/themes/types";

export const runtime = "nodejs";

/**
 * GET — Get active speed run session (if any) and personal bests.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Abandon any expired sessions first
  await abandonExpiredSessions(user.id);

  const [activeSession, personalBests] = await Promise.all([
    getActiveSession(user.id),
    getPersonalBests(user.id),
  ]);

  return NextResponse.json({ activeSession, personalBests });
}

/**
 * POST — Start a new speed run session.
 * Body: { phaseId: string }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { phaseId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { phaseId } = body;
  if (typeof phaseId !== "string" || phaseId.length === 0 || phaseId.length > 50) {
    return NextResponse.json(
      { error: "phaseId is required." },
      { status: 400 }
    );
  }

  // Abandon any expired sessions
  await abandonExpiredSessions(user.id);

  // Check for existing active session
  const existing = await getActiveSession(user.id);
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active speed run. Complete or wait for it to expire." },
      { status: 409 }
    );
  }

  // Select exercises
  const themeId = (user.theme ?? "serious") as ThemeId;
  const exercises = selectSpeedRunExercises(phaseId, themeId);
  if (exercises.length === 0) {
    return NextResponse.json(
      { error: "No eligible exercises found for this phase." },
      { status: 404 }
    );
  }

  const exerciseIds = exercises.map((e) => e.id);
  const session = await createSpeedRunSession(user.id, phaseId, exerciseIds);

  return NextResponse.json({ session }, { status: 201 });
}
