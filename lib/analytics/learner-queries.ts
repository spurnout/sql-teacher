/**
 * SQL query functions for learner analytics.
 */
import { getAdminPool } from "@/lib/db/pool";
import { getThemedPhases } from "@/lib/exercises/loader";
import type { ThemeId } from "@/content/themes/types";
import type {
  XPDataPoint,
  ActivityDay,
  PhaseMastery,
  PhaseAssessment,
} from "./types";

/** XP earned per day with running cumulative total. */
export async function getXPOverTime(
  userId: number,
  rangeDays: number
): Promise<readonly XPDataPoint[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       DATE(created_at) AS date,
       SUM(xp_amount)::int AS daily_xp,
       SUM(SUM(xp_amount)) OVER (ORDER BY DATE(created_at))::int AS cumulative_xp
     FROM user_xp_events
     WHERE user_id = $1
       AND created_at >= NOW() - ($2::int * INTERVAL '1 day')
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [userId, rangeDays]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    date: String(r.date).slice(0, 10),
    dailyXP: Number(r.daily_xp),
    cumulativeXP: Number(r.cumulative_xp),
  }));
}

/** Exercises completed per day over the last 365 days. */
export async function getActivityHeatmap(
  userId: number
): Promise<readonly ActivityDay[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       DATE(completed_at) AS date,
       COUNT(*)::int AS count
     FROM user_progress
     WHERE user_id = $1
       AND completed_at >= NOW() - INTERVAL '365 days'
     GROUP BY DATE(completed_at)
     ORDER BY date`,
    [userId]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    date: String(r.date).slice(0, 10),
    count: Number(r.count),
  }));
}

/** Completion percentage per learning phase. */
export async function getConceptMastery(
  userId: number,
  theme: ThemeId
): Promise<readonly PhaseMastery[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT exercise_id FROM user_progress WHERE user_id = $1`,
    [userId]
  );
  const completedIds = new Set(
    result.rows.map((r: Record<string, unknown>) => String(r.exercise_id))
  );

  const phases = getThemedPhases(theme);
  return phases.map((phase) => {
    const total = phase.exercises.length;
    const completed = phase.exercises.filter((e) =>
      completedIds.has(e.id)
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      phaseId: phase.id,
      phaseTitle: phase.title,
      completionPct,
      completed,
      total,
    };
  });
}

/** Entry vs exit assessment scores per phase. */
export async function getAssessmentScores(
  userId: number,
  theme: ThemeId
): Promise<readonly PhaseAssessment[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT
       a.phase_id,
       a.assessment_type,
       ar.score_pct
     FROM assessment_results ar
     JOIN assessments a ON a.id = ar.assessment_id
     WHERE ar.user_id = $1
     ORDER BY a.phase_id, a.assessment_type`,
    [userId]
  );

  // Build a map of phase_id -> { entry, exit }
  const scoreMap = new Map<string, { entry: number | null; exit: number | null }>();
  for (const row of result.rows as Array<Record<string, unknown>>) {
    const phaseId = String(row.phase_id);
    const type = String(row.assessment_type);
    const score = Number(row.score_pct);
    if (!scoreMap.has(phaseId)) {
      scoreMap.set(phaseId, { entry: null, exit: null });
    }
    const entry = scoreMap.get(phaseId)!;
    if (type === "entry") entry.entry = score;
    else if (type === "exit") entry.exit = score;
  }

  const phases = getThemedPhases(theme);
  return phases.map((phase) => {
    const scores = scoreMap.get(phase.id);
    return {
      phaseId: phase.id,
      phaseTitle: phase.title,
      entryScore: scores?.entry ?? null,
      exitScore: scores?.exit ?? null,
    };
  });
}
