import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { generateRecommendations } from "@/lib/adaptive/recommendations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateRecommendations(user.id, user.theme);
  return NextResponse.json(result);
}
