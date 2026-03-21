/**
 * SQL query functions for team analytics.
 */
import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES } from "@/lib/exercises/loader";
import type {
  FunnelPhase,
  TeamActivityWeek,
  MemberStat,
  BottleneckPhase,
} from "./types";

/** How many members have reached/are currently in each phase. */
export async function getCompletionFunnel(
  memberIds: readonly number[]
): Promise<{ readonly phases: readonly FunnelPhase[]; readonly totalMembers: number }> {
  if (memberIds.length === 0) {
    return { phases: ALL_PHASES.map((p) => ({
      phaseId: p.id, phaseTitle: p.title, membersReached: 0, membersCurrently: 0,
    })), totalMembers: 0 };
  }

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT user_id, exercise_id FROM user_progress WHERE user_id = ANY($1)`,
    [memberIds as number[]]
  );

  // Build per-user completed set
  const userCompleted = new Map<number, Set<string>>();
  for (const row of result.rows as Array<Record<string, unknown>>) {
    const uid = Number(row.user_id);
    const eid = String(row.exercise_id);
    if (!userCompleted.has(uid)) userCompleted.set(uid, new Set());
    userCompleted.get(uid)!.add(eid);
  }

  const totalExercises = ALL_PHASES.reduce((s, p) => s + p.exercises.length, 0);

  const phases: FunnelPhase[] = ALL_PHASES.map((phase) => {
    let membersReached = 0;
    let membersCurrently = 0;
    const phaseExerciseIds = new Set(phase.exercises.map((e) => e.id));

    for (const [, completed] of userCompleted) {
      const doneInPhase = phase.exercises.filter((e) => completed.has(e.id)).length;
      const phaseComplete = doneInPhase === phase.exercises.length;
      if (phaseComplete) membersReached++;

      // "Currently in" = first phase not fully complete
      const userTotal = completed.size;
      if (!phaseComplete && userTotal < totalExercises) {
        // Check if all prior phases are complete
        const priorComplete = ALL_PHASES.slice(0, ALL_PHASES.indexOf(phase)).every(
          (pp) => pp.exercises.every((e) => completed.has(e.id))
        );
        if (priorComplete) membersCurrently++;
      }
    }

    return {
      phaseId: phase.id,
      phaseTitle: phase.title,
      membersReached,
      membersCurrently,
    };
  });

  return { phases, totalMembers: memberIds.length };
}

/** Team-wide exercises completed per week. */
export async function getTeamActivity(
  memberIds: readonly number[],
  weeks: number
): Promise<readonly TeamActivityWeek[]> {
  if (memberIds.length === 0) return [];

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       DATE_TRUNC('week', completed_at)::DATE AS week_start,
       COUNT(*)::int AS exercises_completed,
       COUNT(DISTINCT user_id)::int AS active_members
     FROM user_progress
     WHERE user_id = ANY($1)
       AND completed_at >= NOW() - ($2 || ' weeks')::INTERVAL
     GROUP BY DATE_TRUNC('week', completed_at)
     ORDER BY week_start`,
    [memberIds as number[], String(weeks)]
  );

  return result.rows.map((r: Record<string, unknown>) => ({
    weekStart: String(r.week_start).slice(0, 10),
    exercisesCompleted: Number(r.exercises_completed),
    activeMembers: Number(r.active_members),
  }));
}

/** Top N members by XP. */
export async function getMemberComparison(
  orgId: number,
  limit: number
): Promise<readonly MemberStat[]> {
  const pool = getAdminPool();
  const totalExercises = ALL_PHASES.reduce((s, p) => s + p.exercises.length, 0);

  const result = await pool.query(
    `SELECT
       u.username,
       COALESCE(SUM(x.xp_amount), 0)::int AS total_xp,
       COUNT(DISTINCT p.exercise_id)::int AS exercises_completed
     FROM app_users u
     JOIN org_members m ON m.user_id = u.id AND m.org_id = $1
     LEFT JOIN user_xp_events x ON x.user_id = u.id
     LEFT JOIN user_progress p ON p.user_id = u.id
     GROUP BY u.id, u.username
     ORDER BY total_xp DESC
     LIMIT $2`,
    [orgId, limit]
  );

  return result.rows.map((r: Record<string, unknown>) => ({
    username: String(r.username),
    totalXP: Number(r.total_xp),
    exercisesCompleted: Number(r.exercises_completed),
    completionPct:
      totalExercises > 0
        ? Math.round((Number(r.exercises_completed) / totalExercises) * 100)
        : 0,
  }));
}

/** Which phases have the most stuck members. */
export async function getBottlenecks(
  memberIds: readonly number[]
): Promise<readonly BottleneckPhase[]> {
  if (memberIds.length === 0) {
    return ALL_PHASES.map((p) => ({
      phaseId: p.id, phaseTitle: p.title, stuckCount: 0, avgDaysStuck: 0,
    }));
  }

  const pool = getAdminPool();
  const [progressResult, lastActiveResult] = await Promise.all([
    pool.query(
      `SELECT user_id, exercise_id FROM user_progress WHERE user_id = ANY($1)`,
      [memberIds as number[]]
    ),
    pool.query(
      `SELECT user_id, MAX(completed_at) AS last_active
       FROM user_progress WHERE user_id = ANY($1) GROUP BY user_id`,
      [memberIds as number[]]
    ),
  ]);

  const userCompleted = new Map<number, Set<string>>();
  for (const row of progressResult.rows as Array<Record<string, unknown>>) {
    const uid = Number(row.user_id);
    const eid = String(row.exercise_id);
    if (!userCompleted.has(uid)) userCompleted.set(uid, new Set());
    userCompleted.get(uid)!.add(eid);
  }

  const userLastActive = new Map<number, Date>();
  for (const row of lastActiveResult.rows as Array<Record<string, unknown>>) {
    userLastActive.set(Number(row.user_id), new Date(String(row.last_active)));
  }

  const now = Date.now();

  return ALL_PHASES.map((phase) => {
    const stuckUsers: number[] = [];

    for (const uid of memberIds) {
      const completed = userCompleted.get(uid) ?? new Set<string>();
      const phaseComplete = phase.exercises.every((e) => completed.has(e.id));
      if (phaseComplete) continue;

      // Check if all prior phases are complete (this is the user's current phase)
      const priorComplete = ALL_PHASES.slice(0, ALL_PHASES.indexOf(phase)).every(
        (pp) => pp.exercises.every((e) => completed.has(e.id))
      );
      if (priorComplete) stuckUsers.push(uid);
    }

    let avgDaysStuck = 0;
    if (stuckUsers.length > 0) {
      const totalDays = stuckUsers.reduce((sum, uid) => {
        const lastActive = userLastActive.get(uid);
        if (!lastActive) return sum;
        return sum + (now - lastActive.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDaysStuck = Math.round(totalDays / stuckUsers.length);
    }

    return {
      phaseId: phase.id,
      phaseTitle: phase.title,
      stuckCount: stuckUsers.length,
      avgDaysStuck,
    };
  });
}
