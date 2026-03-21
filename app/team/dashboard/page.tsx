import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import TeamDashboardClient from "./TeamDashboardClient";

export default async function TeamDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const org = await getUserOrg(user.id);
  if (!org) redirect("/team");

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") redirect("/team");

  return (
    <TeamDashboardClient
      username={user.username}
      orgName={org.name}
    />
  );
}
