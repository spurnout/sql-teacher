import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTheme, getThemeDbSchema } from "@/content/themes";
import { isCustomThemeId } from "@/content/themes/types";
import { getCustomThemeSchemaRef } from "@/lib/exercises/loader";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.isAdmin) redirect("/dashboard");

  const schemaReference = isCustomThemeId(user.theme)
    ? await getCustomThemeSchemaRef(user.theme)
    : getTheme(user.theme)?.schemaReference;

  const firstTable = schemaReference?.tables[0]?.name ?? "users";
  const activeSchema = getThemeDbSchema(user.theme) ?? "theme_serious";

  return (
    <StudioClient
      username={user.username}
      schemaReference={schemaReference}
      defaultTable={firstTable}
      activeSchema={activeSchema}
    />
  );
}
