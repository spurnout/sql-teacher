import { notFound, redirect } from "next/navigation";
import { getThemedExercise, getThemedPhases } from "@/lib/exercises/loader";
import { toClientExercise } from "@/lib/exercises/sanitize";
import { getCurrentUser } from "@/lib/auth/session";
import { getTheme } from "@/content/themes";
import LearnPageClient from "./LearnPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ phase: string; exerciseId: string }>;
}

export default async function LearnPage({ params }: Props) {
  const { phase, exerciseId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const exercise = getThemedExercise(user.theme, phase, exerciseId);
  if (!exercise) notFound();

  const clientExercise = toClientExercise(exercise);
  const themedPhases = getThemedPhases(user.theme);
  const theme = getTheme(user.theme);
  const schemaReference = theme?.schemaReference;

  return (
    <LearnPageClient
      exercise={clientExercise}
      allPhases={themedPhases}
      username={user.username}
      schemaReference={schemaReference}
    />
  );
}
