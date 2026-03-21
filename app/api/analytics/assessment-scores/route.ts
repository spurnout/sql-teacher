import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssessmentScores } from "@/lib/analytics/learner-queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phases = await getAssessmentScores(user.id, user.theme);
  return NextResponse.json({ phases });
}
