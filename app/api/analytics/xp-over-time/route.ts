import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getXPOverTime } from "@/lib/analytics/learner-queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = Number(req.nextUrl.searchParams.get("range") ?? "90");
  const safeDays = Math.min(Math.max(range, 7), 365);

  const points = await getXPOverTime(user.id, safeDays);
  return NextResponse.json({ points });
}
