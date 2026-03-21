import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { ALL_CAPSTONES } from "@/content/capstones";
import { getLevel } from "@/lib/gamification/xp";

export async function POST() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = getAdminPool();

  // Check if user already has a certificate
  const existingCert = await pool.query(
    `SELECT certificate_id FROM user_certificates WHERE user_id = $1`,
    [user.id]
  );
  if (existingCert.rows.length > 0) {
    return NextResponse.json({
      certificateId: existingCert.rows[0].certificate_id,
      url: `/certificate/${existingCert.rows[0].certificate_id}`,
    });
  }

  // Verify all capstones are complete
  const capstoneResult = await pool.query(
    `SELECT capstone_id, completed_at FROM user_capstone_progress WHERE user_id = $1`,
    [user.id]
  );
  const completedCapstones = new Set(
    capstoneResult.rows
      .filter((r) => r.completed_at !== null)
      .map((r) => r.capstone_id as string)
  );

  const allCapstonesComplete = ALL_CAPSTONES.every((c) =>
    completedCapstones.has(c.id)
  );
  if (!allCapstonesComplete) {
    return NextResponse.json(
      { error: "Not all capstones completed" },
      { status: 400 }
    );
  }

  // Get total XP
  const xpResult = await pool.query(
    `SELECT COALESCE(SUM(xp_amount), 0)::int AS total_xp FROM user_xp_events WHERE user_id = $1`,
    [user.id]
  );
  const totalXP: number = xpResult.rows[0]?.total_xp ?? 0;
  const level = getLevel(totalXP);

  // Build capstone data
  const capstoneData: Record<
    string,
    { completedAt: string; exerciseCount: number }
  > = {};
  for (const cap of ALL_CAPSTONES) {
    const row = capstoneResult.rows.find((r) => r.capstone_id === cap.id);
    capstoneData[cap.id] = {
      completedAt: row?.completed_at?.toISOString() ?? "",
      exerciseCount: cap.exercises.length,
    };
  }

  // Generate certificate
  const certificateId = randomUUID();

  await pool.query(
    `INSERT INTO user_certificates (user_id, certificate_id, total_xp, level, capstone_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, certificateId, totalXP, level, JSON.stringify(capstoneData)]
  );

  return NextResponse.json({
    certificateId,
    url: `/certificate/${certificateId}`,
  });
}
