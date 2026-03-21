import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAuditLog } from "@/lib/admin/audit";

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
  const action = url.searchParams.get("action") ?? undefined;

  try {
    const result = await getAuditLog({ limit, offset, action });
    return NextResponse.json({
      entries: result.entries,
      total: result.total,
      pagination: { limit, offset },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load audit log." },
      { status: 500 }
    );
  }
}
