import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserOrg,
  getUserOrgRole,
  removeMember,
} from "@/lib/teams/queries";

/** DELETE /api/teams/members — remove a member (managers/owners only) */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { userId } = body;
  if (typeof userId !== "number") {
    return NextResponse.json(
      { error: "userId (number) required" },
      { status: 400 }
    );
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ error: "Not in a team" }, { status: 404 });
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Cannot remove yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await removeMember(org.id, userId);
  return NextResponse.json({ ok: true });
}
