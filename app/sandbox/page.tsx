import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTheme } from "@/content/themes";
import SandboxClient from "./SandboxClient";

export const dynamic = "force-dynamic";

export default async function SandboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const theme = getTheme(user.theme);
  const schemaReference = theme?.schemaReference;
  const firstTable = schemaReference?.tables[0]?.name ?? "users";

  return (
    <SandboxClient
      username={user.username}
      schemaReference={schemaReference}
      defaultTable={firstTable}
    />
  );
}
