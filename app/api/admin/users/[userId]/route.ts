import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { resetUserPassword, deleteUser } from "@/lib/admin/queries";
import { getAdminPool } from "@/lib/db/pool";
import { checkRateLimit, getRateLimitKey } from "@/lib/auth/rate-limit";
import { logAuditEvent } from "@/lib/admin/audit";

const ADMIN_RESET_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 } as const;

interface Params {
  readonly params: Promise<{ userId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit password resets — check early to reduce load under abuse
  const rlKey = getRateLimitKey(req, "admin-reset");
  const rl = checkRateLimit(rlKey, ADMIN_RESET_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Try again later." },
      { status: 429 }
    );
  }

  const { userId } = await params;
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Block resetting another admin's password
  if (id !== admin.id) {
    const pool = getAdminPool();
    const targetResult = await pool.query(
      `SELECT is_admin FROM app_users WHERE id = $1`,
      [id]
    );
    if (targetResult.rows[0]?.is_admin) {
      return NextResponse.json(
        { error: "Cannot reset another admin's password." },
        { status: 400 }
      );
    }
  }

  let reqBody: { newPassword?: unknown };
  try {
    reqBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { newPassword } = reqBody;
  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 128) {
    return NextResponse.json(
      { error: "Password must be 6–128 characters." },
      { status: 400 }
    );
  }

  try {
    await resetUserPassword(id, newPassword);

    logAuditEvent({
      adminId: admin.id,
      action: "user.password_reset",
      targetType: "user",
      targetId: String(id),
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Prevent self-deletion
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account." },
      { status: 400 }
    );
  }

  try {
    // Look up username before deletion for audit logging
    const pool = getAdminPool();
    const targetLookup = await pool.query(
      `SELECT username FROM app_users WHERE id = $1`,
      [id]
    );
    const targetUsername = (targetLookup.rows[0]?.username as string) ?? "unknown";

    const deleted = await deleteUser(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Cannot delete admin users." },
        { status: 400 }
      );
    }

    logAuditEvent({
      adminId: admin.id,
      action: "user.delete",
      targetType: "user",
      targetId: String(id),
      details: { username: targetUsername },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
