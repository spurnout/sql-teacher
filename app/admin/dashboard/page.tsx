import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.isAdmin) redirect("/dashboard");

  return <AdminDashboardClient username={user.username} />;
}
