import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { selectRandomExercise } from "@/lib/challenges/random-practice";
import type { ThemeId } from "@/content/themes/types";

export const runtime = "nodejs";

/**
 * GET — Pick a random incomplete exercise weighted toward weak concepts.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const themeId = (user.theme ?? "serious") as ThemeId;
  const pick = await selectRandomExercise(user.id, themeId);

  if (!pick) {
    return NextResponse.json(
      { error: "No exercises available." },
      { status: 404 }
    );
  }

  return NextResponse.json(pick);
}
