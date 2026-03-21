import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getChallengeAnalytics } from "@/lib/admin/analytics";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const analytics = await getChallengeAnalytics();
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json(
      { error: "Failed to load challenge analytics." },
      { status: 500 }
    );
  }
}
