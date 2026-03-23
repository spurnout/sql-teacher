import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getThemedPhasesAsync } from "@/lib/exercises/loader";
import AuthPage from "./AuthPage";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    const phases = await getThemedPhasesAsync(user.theme);
    const firstExercise = phases[0]?.exercises[0];
    if (firstExercise) {
      redirect(`/learn/${phases[0].id}/${firstExercise.id}`);
    }
    // Fallback if theme has no exercises yet
    redirect("/dashboard");
  }
  return <AuthPage />;
}
