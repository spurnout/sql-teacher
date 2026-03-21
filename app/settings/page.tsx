import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllThemeInfos } from "@/content/themes";
import { getUserOrg } from "@/lib/teams/queries";
import { getOrgCustomThemes } from "@/lib/themes/queries";
import { getAdminPool } from "@/lib/db/pool";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const builtinThemes = getAllThemeInfos();
  const org = await getUserOrg(user.id);
  const customThemeOptions = org
    ? (await getOrgCustomThemes(org.id))
        .filter((ct) => ct.status === "provisioned")
        .map((ct) => ({
          id: `custom-${ct.slug}` as string,
          name: ct.name,
          icon: "🏢",
        }))
    : [];

  const themes = [
    ...builtinThemes.map((t) => ({
      id: t.id as string,
      name: t.name,
      icon: t.icon,
    })),
    ...customThemeOptions,
  ];

  // Get created_at for profile section
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT created_at FROM app_users WHERE id = $1`,
    [user.id]
  );
  const createdAt: string | null = result.rows[0]?.created_at
    ? (result.rows[0].created_at as Date).toISOString()
    : null;

  return (
    <SettingsClient
      username={user.username}
      isAdmin={user.isAdmin}
      currentTheme={user.theme}
      themes={themes}
      createdAt={createdAt}
    />
  );
}
