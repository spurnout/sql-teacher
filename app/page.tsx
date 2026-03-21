import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AuthPage from "./AuthPage";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/learn/phase-0/p0-select-star-worked");
  }
  return <AuthPage />;
}
