import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES } from "@/lib/exercises/loader";
import { getThemedScenario } from "@/lib/scenarios/loader";
import { toClientScenario } from "@/lib/scenarios/sanitize";
import { getScenarioProgress, startScenario } from "@/lib/scenarios/queries";
import { ALL_SCENARIOS } from "@/content/scenarios";
import ScenarioClient from "./ScenarioClient";

interface Props {
  params: Promise<{ scenarioId: string }>;
}

export function generateStaticParams() {
  return ALL_SCENARIOS.map((s) => ({ scenarioId: s.id }));
}

export default async function ScenarioPage({ params }: Props) {
  const { scenarioId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const scenario = getThemedScenario(user.theme, scenarioId);
  if (!scenario) notFound();

  const pool = getAdminPool();

  // Fetch user's completed exercises to verify prerequisites
  const progressResult = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedIds = new Set(
    progressResult.rows.map((r) => r.exercise_id as string)
  );

  // Verify required phases are complete
  for (const phaseId of scenario.requiredPhases) {
    const phase = ALL_PHASES.find((p) => p.id === phaseId);
    if (!phase) continue;
    const allDone = phase.exercises.every((e) => completedIds.has(e.id));
    if (!allDone) {
      redirect("/dashboard?locked=phases");
    }
  }

  // Start scenario if not started yet
  await startScenario(user.id, scenarioId);

  // Get scenario progress
  const scenarioProgress = await getScenarioProgress(user.id, scenarioId);

  const clientScenario = toClientScenario(scenario);

  return (
    <ScenarioClient
      scenario={clientScenario}
      username={user.username}
      initialProgress={scenarioProgress}
    />
  );
}
