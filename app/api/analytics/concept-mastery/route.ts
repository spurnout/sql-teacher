import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getConceptMastery } from "@/lib/analytics/learner-queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phases = await getConceptMastery(user.id, user.theme);
  return NextResponse.json({ phases });
}
