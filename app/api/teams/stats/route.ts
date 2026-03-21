import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { getUserOrg, getUserOrgRole, getOrgMembers } from "@/lib/teams/queries";
import { ALL_PHASES } from "@/lib/exercises/loader";
import { getLevel } from "@/lib/gamification/xp";

/** GET /api/teams/stats — team dashboard stats (managers/owners only) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ error: "Not in a team" }, { status: 404 });
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const pool = getAdminPool();
  const members = await getOrgMembers(org.id);
  const memberIds = members.map((m) => m.userId);

  if (memberIds.length === 0) {
    return NextResponse.json({
      totalMembers: 0,
      activeThisWeek: 0,
      avgCompletionPct: 0,
      avgXP: 0,
      members: [],
    });
  }

  // Build total exercise count
  const totalExercises = ALL_PHASES.reduce((sum, p) => sum + p.exercises.length, 0);

  // Fetch progress, XP, and streaks for all members
  const [progressResult, xpResult, streakResult] = await Promise.all([
    pool.query(
      `SELECT user_id, COUNT(*)::int AS completed_count, MAX(completed_at) AS last_active
       FROM user_progress
       WHERE user_id = ANY($1)
       GROUP BY user_id`,
      [memberIds]
    ),
    pool.query(
      `SELECT user_id, COALESCE(SUM(xp_amount), 0)::int AS total_xp
       FROM user_xp_events
       WHERE user_id = ANY($1)
       GROUP BY user_id`,
      [memberIds]
    ),
    pool.query(
      `SELECT user_id, current_streak, longest_streak, last_activity_date
       FROM user_streaks
       WHERE user_id = ANY($1)`,
      [memberIds]
    ),
  ]);

  // Build lookup maps
  const progressMap = new Map(
    progressResult.rows.map((r) => [
      r.user_id as number,
      { completedCount: r.completed_count as number, lastActive: r.last_active as string },
    ])
  );
  const xpMap = new Map(
    xpResult.rows.map((r) => [r.user_id as number, r.total_xp as number])
  );
  const streakMap = new Map(
    streakResult.rows.map((r) => [
      r.user_id as number,
      {
        current: r.current_streak as number,
        lastActivity: r.last_activity_date as string,
      },
    ])
  );

  // Determine current phase per member
  const phaseExerciseIds = ALL_PHASES.map((p) => ({
    phaseId: p.id,
    exerciseIds: new Set(p.exercises.map((e) => e.id)),
  }));

  // Get per-member completed exercise IDs for phase computation
  const memberExercisesResult = await pool.query(
    `SELECT user_id, exercise_id FROM user_progress WHERE user_id = ANY($1)`,
    [memberIds]
  );
  const memberExercises = new Map<number, Set<string>>();
  for (const row of memberExercisesResult.rows) {
    const uid = row.user_id as number;
    const existing = memberExercises.get(uid) ?? new Set();
    existing.add(row.exercise_id as string);
    memberExercises.set(uid, existing);
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let activeThisWeek = 0;
  let totalCompletionPct = 0;
  let totalXPSum = 0;

  const memberStats = members.map((member) => {
    const progress = progressMap.get(member.userId);
    const xp = xpMap.get(member.userId) ?? 0;
    const streak = streakMap.get(member.userId);
    const completedCount = progress?.completedCount ?? 0;
    const completionPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
    const lastActive = progress?.lastActive ?? null;

    // Check if active this week
    if (lastActive && new Date(lastActive) >= oneWeekAgo) {
      activeThisWeek++;
    }

    totalCompletionPct += completionPct;
    totalXPSum += xp;

    // Find current phase (first incomplete one)
    const userCompleted = memberExercises.get(member.userId) ?? new Set();
    let currentPhase = ALL_PHASES[0].id;
    for (const pe of phaseExerciseIds) {
      const allDone = [...pe.exerciseIds].every((id) => userCompleted.has(id));
      if (!allDone) {
        currentPhase = pe.phaseId;
        break;
      }
    }

    return {
      userId: member.userId,
      username: member.username,
      role: member.role,
      currentPhase,
      exercisesCompleted: completedCount,
      totalXP: xp,
      level: getLevel(xp),
      streak: streak?.current ?? 0,
      lastActive,
    };
  });

  return NextResponse.json({
    totalMembers: members.length,
    activeThisWeek,
    avgCompletionPct: members.length > 0 ? Math.round(totalCompletionPct / members.length) : 0,
    avgXP: members.length > 0 ? Math.round(totalXPSum / members.length) : 0,
    members: memberStats,
  });
}
