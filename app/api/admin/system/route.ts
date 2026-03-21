import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getSystemInfo } from "@/lib/admin/system";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const info = await getSystemInfo();
    return NextResponse.json(info);
  } catch {
    return NextResponse.json(
      { error: "Failed to load system info." },
      { status: 500 }
    );
  }
}
