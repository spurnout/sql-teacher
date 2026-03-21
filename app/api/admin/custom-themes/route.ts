import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllCustomThemes } from "@/lib/admin/queries";

export const runtime = "nodejs";

/**
 * GET — List all custom themes across all organizations.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const themes = await getAllCustomThemes();
    return NextResponse.json({ themes });
  } catch {
    return NextResponse.json(
      { error: "Failed to load custom themes." },
      { status: 500 }
    );
  }
}
