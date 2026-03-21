import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth/session";
import { getAdminPool } from "@/lib/db/pool";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.isAdmin) {
    return NextResponse.json(
      {
        error:
          "Admins cannot self-delete via settings. Use the admin dashboard.",
      },
      { status: 400 }
    );
  }

  let body: { confirmUsername?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    typeof body.confirmUsername !== "string" ||
    body.confirmUsername !== user.username
  ) {
    return NextResponse.json(
      { error: "Username confirmation does not match." },
      { status: 400 }
    );
  }

  try {
    const pool = getAdminPool();

    // Delete all sessions for this user before deleting the account
    await pool.query(`DELETE FROM app_sessions WHERE user_id = $1`, [user.id]);
    const deleteResult = await pool.query(
      `DELETE FROM app_users WHERE id = $1 AND is_admin = FALSE RETURNING id`,
      [user.id]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Account deletion failed." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  }
}
