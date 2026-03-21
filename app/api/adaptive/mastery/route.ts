import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { computeConceptMastery } from "@/lib/adaptive/mastery";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const concepts = await computeConceptMastery(user.id, user.theme);
  return NextResponse.json({ concepts });
}
