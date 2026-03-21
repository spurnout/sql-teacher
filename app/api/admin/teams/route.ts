import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllOrganizations } from "@/lib/admin/queries";

export const runtime = "nodejs";

/**
 * GET — List all organizations with owner info and member/theme counts.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const teams = await getAllOrganizations();
    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json(
      { error: "Failed to load teams." },
      { status: 500 }
    );
  }
}
