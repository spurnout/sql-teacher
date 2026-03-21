import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES } from "@/lib/exercises/loader";
import { ALL_CAPSTONES, getCapstone } from "@/content/capstones";
import { toClientExercise } from "@/lib/exercises/sanitize";
import CapstoneClient from "./CapstoneClient";

interface Props {
  params: Promise<{ capstoneId: string }>;
}

export function generateStaticParams() {
  return ALL_CAPSTONES.map((c) => ({ capstoneId: c.id }));
}

export default async function CapstonePage({ params }: Props) {
  const { capstoneId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const capstone = getCapstone(capstoneId);
  if (!capstone) notFound();

  const pool = getAdminPool();

  // Fetch user's completed exercises
  const progressResult = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedIds = new Set(
    progressResult.rows.map((r) => r.exercise_id as string)
  );

  // Verify all required phases have all exercises completed
  for (const phaseId of capstone.requiredPhases) {
    const phase = ALL_PHASES.find((p) => p.id === phaseId);
    if (!phase) continue;
    const allDone = phase.exercises.every((e) => completedIds.has(e.id));
    if (!allDone) {
      redirect("/dashboard?locked=phases");
    }
  }

  // Record capstone start (no-op if already started)
  await pool.query(
    `INSERT INTO user_capstone_progress (user_id, capstone_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, capstone_id) DO NOTHING`,
    [user.id, capstoneId]
  );

  // Get capstone progress record
  const capstoneProgress = await pool.query(
    `SELECT started_at, completed_at
     FROM user_capstone_progress
     WHERE user_id = $1 AND capstone_id = $2`,
    [user.id, capstoneId]
  );

  const clientExercises = capstone.exercises.map(toClientExercise);
  const initialCompletedIds = capstone.exercises
    .filter((e) => completedIds.has(e.id))
    .map((e) => e.id);

  return (
    <CapstoneClient
      capstone={{
        id: capstone.id,
        title: capstone.title,
        description: capstone.description,
      }}
      exercises={clientExercises}
      username={user.username}
      initialCompletedIds={initialCompletedIds}
      startedAt={
        capstoneProgress.rows[0]?.started_at?.toISOString() ??
        new Date().toISOString()
      }
    />
  );
}
