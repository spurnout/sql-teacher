import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getExerciseAnalytics } from "@/lib/admin/analytics";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const analytics = await getExerciseAnalytics();
    return NextResponse.json(analytics);
  } catch {
    return NextResponse.json(
      { error: "Failed to load exercise analytics." },
      { status: 500 }
    );
  }
}
