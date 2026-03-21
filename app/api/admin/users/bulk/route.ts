import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { bulkCreateUsers } from "@/lib/admin/queries";
import { logAuditEvent } from "@/lib/admin/audit";

const MAX_BATCH_SIZE = 100;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { users?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.users)) {
    return NextResponse.json(
      { error: "Request body must include a 'users' array." },
      { status: 400 }
    );
  }

  if (body.users.length === 0) {
    return NextResponse.json(
      { error: "Users array is empty." },
      { status: 400 }
    );
  }

  if (body.users.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BATCH_SIZE} users per batch.` },
      { status: 400 }
    );
  }

  // Validate shape of each entry
  const users: { username: string; password: string }[] = [];
  for (const entry of body.users) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.username !== "string" ||
      typeof entry.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Each user must have 'username' and 'password' strings." },
        { status: 400 }
      );
    }
    users.push({ username: entry.username, password: entry.password });
  }

  try {
    const result = await bulkCreateUsers(users);

    logAuditEvent({
      adminId: admin.id,
      action: "user.bulk_import",
      targetType: "user",
      details: { total: users.length, created: result.created, errors: result.errors.length },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({
      created: result.created,
      errors: result.errors,
      total: users.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Bulk import failed." },
      { status: 500 }
    );
  }
}
