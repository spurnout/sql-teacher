import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedPhases } from "@/lib/exercises/loader";
import GolfClient from "./GolfClient";

export const dynamic = "force-dynamic";

export default async function GolfPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const phases = getThemedPhases(user.theme);

  // Collect all completed-able exercises (open/scaffolded only)
  const exercises = phases.flatMap((p) =>
    p.exercises
      .filter((e) => e.mode === "open" || e.mode === "scaffolded")
      .map((e) => ({
        id: e.id,
        title: e.title,
        phase: p.id,
        phaseTitle: p.title,
        concept: e.concept,
      }))
  );

  return (
    <GolfClient
      username={user.username}
      exercises={exercises}
    />
  );
}
