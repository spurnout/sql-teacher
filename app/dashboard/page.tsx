import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { getThemedPhases, getThemedCapstones } from "@/lib/exercises/loader";
import { getLevel, getNextLevelThreshold } from "@/lib/gamification/xp";
import { getAllPaths, computePathProgress } from "@/lib/paths/loader";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const pool = getAdminPool();

  const [progressResult, viewsResult, xpResult, streakResult, badgesResult, capstoneResult] =
    await Promise.all([
      pool.query(
        `SELECT exercise_id, completed_at FROM user_progress WHERE user_id = $1`,
        [user.id]
      ),
      pool.query(
        `SELECT exercise_id, viewed_at FROM user_solution_views WHERE user_id = $1`,
        [user.id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(xp_amount), 0)::int AS total_xp FROM user_xp_events WHERE user_id = $1`,
        [user.id]
      ),
      pool.query(
        `SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = $1`,
        [user.id]
      ),
      pool.query(
        `SELECT badge_id, earned_at FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC`,
        [user.id]
      ),
      pool.query(
        `SELECT capstone_id, started_at, completed_at FROM user_capstone_progress WHERE user_id = $1`,
        [user.id]
      ),
    ]);

  const completed = Object.fromEntries(
    progressResult.rows.map((r) => [
      r.exercise_id,
      { completedAt: r.completed_at as string },
    ])
  );

  const solutionViews = Object.fromEntries(
    viewsResult.rows.map((r) => [
      r.exercise_id,
      { viewedAt: r.viewed_at as string },
    ])
  );

  const totalXP: number = xpResult.rows[0]?.total_xp ?? 0;
  const level = getLevel(totalXP);
  const levelProgress = getNextLevelThreshold(totalXP);

  const streakRow = streakResult.rows[0];
  const streak = {
    current: (streakRow?.current_streak as number) ?? 0,
    longest: (streakRow?.longest_streak as number) ?? 0,
  };

  const badges = badgesResult.rows.map((r) => ({
    badgeId: r.badge_id as string,
    earnedAt: r.earned_at as string,
  }));

  // Load themed content
  const themedPhases = getThemedPhases(user.theme);
  const themedCapstones = getThemedCapstones(user.theme);

  // Build capstone progress data
  const completedIds = new Set(Object.keys(completed));
  const capstoneProgressMap: Record<string, { startedAt: string | null; completedAt: string | null }> = {};
  for (const row of capstoneResult.rows) {
    capstoneProgressMap[row.capstone_id] = {
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
    };
  }

  const capstones = themedCapstones.map((c) => {
    const phasesComplete = c.requiredPhases.every((phaseId) => {
      const phase = themedPhases.find((p) => p.id === phaseId);
      if (!phase) return false;
      return phase.exercises.every((e) => completedIds.has(e.id));
    });
    const exercisesComplete = c.exercises.filter((e) => completedIds.has(e.id)).length;
    const progress = capstoneProgressMap[c.id];
    return {
      id: c.id,
      title: c.title,
      exerciseCount: c.exercises.length,
      exercisesComplete,
      phasesComplete,
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null,
    };
  });

  // Compute learning path progress
  const allPaths = await getAllPaths();
  const pathsProgress = await Promise.all(
    allPaths.map((path) => computePathProgress(user.id, path, completedIds))
  );

  // Build safe phase data — strip expectedSql, hints, explanation, variation
  const dashboardPhases = themedPhases.map((p) => ({
    id: p.id,
    title: p.title,
    exercises: p.exercises.map((e) => ({
      id: e.id,
      title: e.title,
      concept: e.concept,
      phase: e.phase,
      mode: e.mode,
    })),
  }));

  // Serialize path progress for client (strip non-serializable fields)
  const serializedPaths = pathsProgress.map((pp) => ({
    path: {
      id: pp.path.id,
      slug: pp.path.slug,
      title: pp.path.title,
      description: pp.path.description,
      estimatedHours: pp.path.estimatedHours,
      targetRole: pp.path.targetRole,
      phases: pp.path.phases.map((ph) => ({
        phaseId: ph.phaseId,
        phaseOrder: ph.phaseOrder,
        milestoneLabel: ph.milestoneLabel,
      })),
    },
    enrollment: pp.enrollment,
    phasesCompleted: pp.phasesCompleted,
    totalPhases: pp.totalPhases,
    exercisesCompleted: pp.exercisesCompleted,
    totalExercises: pp.totalExercises,
    currentMilestone: pp.currentMilestone,
    nextMilestone: pp.nextMilestone,
  }));

  return (
    <DashboardClient
      username={user.username}
      isAdmin={user.isAdmin}
      allPhases={dashboardPhases}
      completed={completed}
      solutionViews={solutionViews}
      totalXP={totalXP}
      level={level}
      levelProgress={{
        progress: levelProgress.progress,
        nextLevel: levelProgress.nextLevel,
        nextThreshold: levelProgress.nextThreshold,
      }}
      streak={streak}
      badges={badges}
      capstones={capstones}
      learningPaths={serializedPaths}
    />
  );
}
