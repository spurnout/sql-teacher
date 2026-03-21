import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json(
      { error: "Both passwords required." },
      { status: 400 }
    );
  }
  if (newPassword.length < 6 || newPassword.length > 128) {
    return NextResponse.json(
      { error: "New password must be 6–128 characters." },
      { status: 400 }
    );
  }

  try {
    const pool = getAdminPool();
    const result = await pool.query(
      `SELECT password_hash FROM app_users WHERE id = $1`,
      [user.id]
    );
    if (!result.rows[0]) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const valid = await verifyPassword(
      currentPassword,
      result.rows[0].password_hash
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await pool.query(`UPDATE app_users SET password_hash = $1 WHERE id = $2`, [
      newHash,
      user.id,
    ]);

    // Invalidate all existing sessions except the current one.
    // This ensures stolen session tokens are revoked after password change.
    const currentToken = req.cookies.get("sql_teacher_session")?.value;
    if (currentToken) {
      await pool.query(
        `DELETE FROM app_sessions WHERE user_id = $1 AND token != $2`,
        [user.id, currentToken]
      );
    } else {
      await pool.query(`DELETE FROM app_sessions WHERE user_id = $1`, [
        user.id,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}
