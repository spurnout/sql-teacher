import { notFound, redirect } from "next/navigation";
import {
  getThemedExerciseAsync,
  getThemedPhasesAsync,
  getCustomThemeSchemaRef,
} from "@/lib/exercises/loader";
import { toClientExercise } from "@/lib/exercises/sanitize";
import { getCurrentUser } from "@/lib/auth/session";
import { getTheme } from "@/content/themes";
import { isCustomThemeId } from "@/content/themes/types";
import LearnPageClient from "./LearnPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ phase: string; exerciseId: string }>;
}

export default async function LearnPage({ params }: Props) {
  const { phase, exerciseId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const exercise = await getThemedExerciseAsync(user.theme, phase, exerciseId);
  if (!exercise) notFound();

  const clientExercise = toClientExercise(exercise);
  const themedPhases = await getThemedPhasesAsync(user.theme);
  const schemaReference = isCustomThemeId(user.theme)
    ? await getCustomThemeSchemaRef(user.theme)
    : getTheme(user.theme)?.schemaReference;

  return (
    <LearnPageClient
      exercise={clientExercise}
      allPhases={themedPhases}
      username={user.username}
      schemaReference={schemaReference}
    />
  );
}
