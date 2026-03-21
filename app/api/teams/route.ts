import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserOrg,
  getUserOrgRole,
  getOrgMembers,
  createOrg,
} from "@/lib/teams/queries";

/** GET /api/teams — get current user's team info */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ org: null, members: [], role: null });
  }

  const [members, role] = await Promise.all([
    getOrgMembers(org.id),
    getUserOrgRole(user.id, org.id),
  ]);

  return NextResponse.json({ org, members, role });
}

/** POST /api/teams — create a new team */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name } = body;
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Team name required" },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length === 0) {
    return NextResponse.json(
      { error: "Invalid team name" },
      { status: 400 }
    );
  }

  try {
    const org = await createOrg(user.id, name.trim(), slug);
    return NextResponse.json({ ok: true, org });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create team";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
