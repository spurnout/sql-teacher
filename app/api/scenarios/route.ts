import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedScenarios } from "@/lib/scenarios/loader";
import { toClientScenario } from "@/lib/scenarios/sanitize";
import { getAllScenarioProgress } from "@/lib/scenarios/queries";

export const runtime = "nodejs";

/**
 * GET /api/scenarios — list all scenarios with user progress
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenarios = getThemedScenarios(user.theme);
  const progressList = await getAllScenarioProgress(user.id);
  const progressMap = new Map(progressList.map((p) => [p.scenarioId, p]));

  const result = scenarios.map((s) => ({
    ...toClientScenario(s),
    progress: progressMap.get(s.id) ?? null,
  }));

  return NextResponse.json({ scenarios: result });
}
