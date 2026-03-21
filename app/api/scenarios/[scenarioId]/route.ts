import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedScenario } from "@/lib/scenarios/loader";
import { toClientScenario } from "@/lib/scenarios/sanitize";
import { getScenarioProgress, startScenario } from "@/lib/scenarios/queries";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ scenarioId: string }>;
}

/**
 * GET /api/scenarios/:scenarioId — single scenario with progress
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { scenarioId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenario = getThemedScenario(user.theme, scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const progress = await getScenarioProgress(user.id, scenarioId);

  return NextResponse.json({
    scenario: toClientScenario(scenario),
    progress,
  });
}

/**
 * POST /api/scenarios/:scenarioId — start a scenario
 */
export async function POST(
  _req: NextRequest,
  { params }: RouteContext
) {
  const { scenarioId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenario = getThemedScenario(user.theme, scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  await startScenario(user.id, scenarioId);
  const progress = await getScenarioProgress(user.id, scenarioId);

  return NextResponse.json({ ok: true, progress });
}
