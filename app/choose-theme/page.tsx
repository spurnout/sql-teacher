import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import ThemePickerClient from "./ThemePickerClient";
import { getAllThemeInfos } from "@/content/themes";
import { getUserOrg } from "@/lib/teams/queries";
import { getOrgCustomThemes } from "@/lib/themes/queries";

export const dynamic = "force-dynamic";

export default async function ChooseThemePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const builtinThemes = getAllThemeInfos();

  // Load provisioned custom themes for the user's org (if any)
  const org = await getUserOrg(user.id);
  const customThemeOptions = org
    ? (await getOrgCustomThemes(org.id))
        .filter((ct) => ct.status === "provisioned")
        .map((ct) => ({
          id: `custom-${ct.slug}` as const,
          name: ct.name,
          tagline: ct.description ?? "Custom team database",
          icon: "🏢",
          tablePreview: ct.schema_ref?.tables?.map((t) => t.name) ?? [],
        }))
    : [];

  const allThemes = [
    ...builtinThemes.map((t) => ({
      id: t.id as string,
      name: t.name,
      tagline: t.tagline,
      icon: t.icon,
      tablePreview: [...t.tablePreview],
    })),
    ...customThemeOptions,
  ];

  return (
    <ThemePickerClient
      themes={allThemes}
      currentTheme={user.theme}
    />
  );
}
