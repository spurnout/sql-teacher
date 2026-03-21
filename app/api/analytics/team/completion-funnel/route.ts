import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole, getOrgMembers } from "@/lib/teams/queries";
import { getCompletionFunnel } from "@/lib/analytics/team-queries";

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

  const members = await getOrgMembers(org.id);
  const memberIds = members.map((m) => m.userId);
  const result = await getCompletionFunnel(memberIds);
  return NextResponse.json(result);
}
