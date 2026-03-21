import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllUsersWithStats, getGlobalSummaryStats, createUser } from "@/lib/admin/queries";
import { logAuditEvent } from "@/lib/admin/audit";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const rawOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 200);
  const offset = Math.min(Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0), 100_000);
  const search = url.searchParams.get("search") ?? undefined;

  try {
    const [{ users, total }, summary] = await Promise.all([
      getAllUsersWithStats({ limit, offset, search }),
      getGlobalSummaryStats(),
    ]);

    return NextResponse.json({
      users,
      total,
      pagination: { limit, offset },
      summary,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load user data." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { username, password } = body;

  if (typeof username !== "string" || username.length < 3 || username.length > 32) {
    return NextResponse.json(
      { error: "Username must be 3–32 characters." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 6–128 characters." },
      { status: 400 }
    );
  }

  try {
    const user = await createUser(username, password);

    logAuditEvent({
      adminId: admin.id,
      action: "user.create",
      targetType: "user",
      targetId: String(user.id),
      details: { username: user.username },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: unknown) {
    // Handle unique constraint violation (duplicate username)
    if (err instanceof Error && "code" in err && (err as Record<string, unknown>).code === "23505") {
      return NextResponse.json(
        { error: "Username already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}
