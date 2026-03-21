import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { ALL_PHASES, findExerciseById, findThemedExerciseById } from "@/lib/exercises/loader";
import { ALL_CAPSTONES } from "@/content/capstones";
import { ALL_SCENARIOS } from "@/content/scenarios";
import { calculateXP } from "@/lib/gamification/xp";
import { checkBadgeEligibility } from "@/lib/gamification/badges";
import type { BadgeId } from "@/lib/exercises/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ completed: {}, solutionViews: {} }, { status: 401 });

  const pool = getAdminPool();
  const [progressResult, viewsResult] = await Promise.all([
    pool.query(
      `SELECT exercise_id, completed_at FROM user_progress WHERE user_id = $1`,
      [user.id]
    ),
    pool.query(
      `SELECT exercise_id, viewed_at FROM user_solution_views WHERE user_id = $1`,
      [user.id]
    ),
  ]);

  const completed: Record<string, { completedAt: string }> = {};
  for (const row of progressResult.rows) {
    completed[row.exercise_id] = { completedAt: row.completed_at };
  }

  const solutionViews: Record<string, { viewedAt: string }> = {};
  for (const row of viewsResult.rows) {
    solutionViews[row.exercise_id] = { viewedAt: row.viewed_at };
  }

  return NextResponse.json({ completed, solutionViews });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { exerciseId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { exerciseId } = body;
  if (typeof exerciseId !== "string" || exerciseId.length === 0 || exerciseId.length > 200) {
    return NextResponse.json({ error: "exerciseId required (max 200 chars)" }, { status: 400 });
  }

  const pool = getAdminPool();

  // 1. Record completion (no-op if already completed)
  const insertResult = await pool.query(
    `INSERT INTO user_progress (user_id, exercise_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, exercise_id) DO NOTHING
     RETURNING id`,
    [user.id, exerciseId]
  );

  // If no rows returned, exercise was already completed — skip XP/badges
  if (insertResult.rows.length === 0) {
    return NextResponse.json({ ok: true, xpEarned: 0, newBadges: [], streak: 0 });
  }

  // 2. Find the exercise metadata for XP calculation (searches user's theme, falls back to serious)
  const exercise = findThemedExerciseById(user.theme, exerciseId) ?? findExerciseById(exerciseId);

  if (!exercise) {
    return NextResponse.json({ ok: true, xpEarned: 0, newBadges: [], streak: 0 });
  }

  // 3. Check if user viewed solution (for first-attempt bonus)
  const viewResult = await pool.query(
    `SELECT 1 FROM user_solution_views WHERE user_id = $1 AND exercise_id = $2`,
    [user.id, exerciseId]
  );
  const firstAttempt = viewResult.rows.length === 0;

  // 4. Update streak — use CURRENT_DATE from the database for consistent timezone handling
  const streakResult = await pool.query(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
     VALUES ($1, 1, 1, CURRENT_DATE)
     ON CONFLICT (user_id) DO UPDATE SET
       current_streak = CASE
         WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
         WHEN user_streaks.last_activity_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN user_streaks.current_streak + 1
         ELSE 1
       END,
       longest_streak = GREATEST(
         user_streaks.longest_streak,
         CASE
           WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
           WHEN user_streaks.last_activity_date = (CURRENT_DATE - INTERVAL '1 day')::date THEN user_streaks.current_streak + 1
           ELSE 1
         END
       ),
       last_activity_date = CURRENT_DATE
     RETURNING current_streak`,
    [user.id]
  );
  const currentStreak: number = streakResult.rows[0]?.current_streak ?? 0;

  // 5. Calculate and grant XP
  const xpAmount = calculateXP(exercise.difficulty, exercise.mode, firstAttempt, currentStreak);

  // Insert base XP
  await pool.query(
    `INSERT INTO user_xp_events (user_id, exercise_id, xp_amount, reason)
     VALUES ($1, $2, $3, 'completion')
     ON CONFLICT (user_id, exercise_id, reason) DO NOTHING`,
    [user.id, exerciseId, xpAmount]
  );

  // 6. Check badge eligibility
  const [allProgressResult, allViewsResult, allBadgesResult] = await Promise.all([
    pool.query(`SELECT exercise_id FROM user_progress WHERE user_id = $1`, [user.id]),
    pool.query(`SELECT exercise_id FROM user_solution_views WHERE user_id = $1`, [user.id]),
    pool.query(`SELECT badge_id FROM user_badges WHERE user_id = $1`, [user.id]),
  ]);

  const completedExerciseIds = new Set(allProgressResult.rows.map((r) => r.exercise_id as string));
  const solutionViewedIds = new Set(allViewsResult.rows.map((r) => r.exercise_id as string));
  const existingBadgeIds = new Set(allBadgesResult.rows.map((r) => r.badge_id as string));

  // Build phase exercise map
  const phaseExercises = new Map<string, readonly string[]>();
  for (const phase of ALL_PHASES) {
    phaseExercises.set(phase.id, phase.exercises.map((e) => e.id));
  }

  // Quiz exercise IDs
  const quizExerciseIds = new Set(
    ALL_PHASES.flatMap((p) => p.exercises)
      .filter((e) => e.mode === "quiz")
      .map((e) => e.id)
  );

  // Check capstone completion against the known capstone list
  const capstoneProgressResult = await pool.query(
    `SELECT capstone_id, completed_at FROM user_capstone_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedCapstoneIds = new Set(
    capstoneProgressResult.rows
      .filter((r) => r.completed_at !== null)
      .map((r) => r.capstone_id as string)
  );
  const allCapstonesComplete = ALL_CAPSTONES.every((c) =>
    completedCapstoneIds.has(c.id)
  );

  // Check scenario completion
  const scenarioProgressResult = await pool.query(
    `SELECT scenario_id, completed_at FROM user_scenario_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedScenarioIds = new Set(
    scenarioProgressResult.rows
      .filter((r) => r.completed_at !== null)
      .map((r) => r.scenario_id as string)
  );
  const allScenariosComplete = ALL_SCENARIOS.length > 0 && ALL_SCENARIOS.every((s) =>
    completedScenarioIds.has(s.id)
  );

  const newBadges = checkBadgeEligibility({
    completedExerciseIds,
    solutionViewedIds,
    existingBadgeIds,
    currentStreak,
    phaseExercises,
    quizExerciseIds,
    allCapstonesComplete,
    allScenariosComplete,
    totalCompletions: completedExerciseIds.size,
  });

  // Award new badges (parallel insertion — use allSettled so one failure doesn't block others)
  if (newBadges.length > 0) {
    const badgeResults = await Promise.allSettled(
      newBadges.map((badgeId) =>
        pool.query(
          `INSERT INTO user_badges (user_id, badge_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, badge_id) DO NOTHING`,
          [user.id, badgeId]
        )
      )
    );
    for (const r of badgeResults) {
      if (r.status === "rejected") {
        console.error("[progress] Badge insert failed:", r.reason);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    xpEarned: xpAmount,
    newBadges: newBadges as BadgeId[],
    streak: currentStreak,
  });
}
