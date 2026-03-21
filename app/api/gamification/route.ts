import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { getLevel, getNextLevelThreshold } from "@/lib/gamification/xp";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getAdminPool();

  const [xpResult, streakResult, badgesResult] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(xp_amount), 0)::int AS total_xp
       FROM user_xp_events WHERE user_id = $1`,
      [user.id]
    ),
    pool.query(
      `SELECT current_streak, longest_streak, last_activity_date
       FROM user_streaks WHERE user_id = $1`,
      [user.id]
    ),
    pool.query(
      `SELECT badge_id, earned_at
       FROM user_badges WHERE user_id = $1
       ORDER BY earned_at DESC`,
      [user.id]
    ),
  ]);

  const totalXP: number = xpResult.rows[0]?.total_xp ?? 0;
  const level = getLevel(totalXP);
  const levelProgress = getNextLevelThreshold(totalXP);

  const streakRow = streakResult.rows[0];
  const streak = streakRow
    ? {
        current: streakRow.current_streak as number,
        longest: streakRow.longest_streak as number,
        lastDate: streakRow.last_activity_date as string,
      }
    : { current: 0, longest: 0, lastDate: null };

  const badges = badgesResult.rows.map((r) => ({
    badgeId: r.badge_id as string,
    earnedAt: r.earned_at as string,
  }));

  return NextResponse.json({
    totalXP,
    level,
    levelProgress: {
      currentLevel: levelProgress.currentLevel,
      nextLevel: levelProgress.nextLevel,
      progress: levelProgress.progress,
      nextThreshold: levelProgress.nextThreshold,
    },
    streak,
    badges,
  });
}
