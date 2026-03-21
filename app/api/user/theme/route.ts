import { NextRequest, NextResponse } from "next/server";
import { getAdminPool } from "@/lib/db/pool";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidThemeId } from "@/content/themes/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({ theme: user.theme });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { theme?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { theme } = body;
  if (typeof theme !== "string" || !isValidThemeId(theme)) {
    return NextResponse.json(
      { error: "Invalid theme ID." },
      { status: 400 }
    );
  }

  const pool = getAdminPool();
  await pool.query(
    `UPDATE app_users SET theme = $1 WHERE id = $2`,
    [theme, user.id]
  );

  return NextResponse.json({ theme });
}
