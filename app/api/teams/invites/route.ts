import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserOrg,
  getUserOrgRole,
  createInvite,
  getOrgInvites,
  acceptInvite,
} from "@/lib/teams/queries";

/** GET /api/teams/invites — list active invites (managers/owners only) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ error: "Not in a team" }, { status: 404 });
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const invites = await getOrgInvites(org.id);
  return NextResponse.json({ invites });
}

/** POST /api/teams/invites — create invite or accept an invite code */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Accept an existing invite
  if (typeof body.code === "string") {
    try {
      const result = await acceptInvite(user.id, body.code);
      return NextResponse.json({ ok: true, org: result.org, role: result.role });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to accept invite";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // Create a new invite (managers/owners only)
  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ error: "Not in a team" }, { status: 404 });
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const inviteRole = body.role === "manager" ? "manager" : "member";
  const invite = await createInvite(org.id, inviteRole);
  return NextResponse.json({ ok: true, invite });
}
