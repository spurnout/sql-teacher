import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedPhases } from "@/lib/exercises/loader";
import SpeedRunClient from "./SpeedRunClient";

export const dynamic = "force-dynamic";

export default async function SpeedRunPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const phases = getThemedPhases(user.theme);

  // Build phase summaries for the selector
  const phaseSummaries = phases.map((p) => ({
    id: p.id,
    title: p.title,
    exerciseCount: p.exercises.filter(
      (e) => e.mode === "open" || e.mode === "scaffolded"
    ).length,
  }));

  return (
    <SpeedRunClient
      username={user.username}
      phaseSummaries={phaseSummaries}
    />
  );
}
