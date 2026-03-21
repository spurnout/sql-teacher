import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole, getOrgMembers, getOrgInvites } from "@/lib/teams/queries";
import { getOrgCustomThemes } from "@/lib/themes/queries";
import TeamPageClient from "./TeamPageClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const org = await getUserOrg(user.id);

  if (!org) {
    // Show create/join team UI
    return <TeamPageClient username={user.username} org={null} members={[]} invites={[]} role={null} />;
  }

  const [role, members, invites, customThemes] = await Promise.all([
    getUserOrgRole(user.id, org.id),
    getOrgMembers(org.id),
    (async () => {
      const r = await getUserOrgRole(user.id, org.id);
      if (r === "owner" || r === "manager") {
        return getOrgInvites(org.id);
      }
      return [];
    })(),
    getOrgCustomThemes(org.id),
  ]);

  const serializedMembers = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    username: m.username,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  const serializedInvites = invites.map((i) => ({
    id: i.id,
    code: i.code,
    role: i.role,
    expiresAt: i.expiresAt,
    usedBy: i.usedBy,
  }));

  const serializedCustomThemes = customThemes.map((ct) => ({
    id: ct.id,
    slug: ct.slug,
    name: ct.name,
    description: ct.description,
    status: ct.status,
    error_message: ct.error_message,
    created_at: ct.created_at,
  }));

  return (
    <TeamPageClient
      username={user.username}
      org={{ id: org.id, name: org.name, slug: org.slug, createdAt: org.createdAt }}
      members={serializedMembers}
      invites={serializedInvites}
      role={role}
      customThemes={serializedCustomThemes}
    />
  );
}
