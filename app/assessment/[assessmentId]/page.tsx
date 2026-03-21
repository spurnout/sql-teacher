import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllAssessments } from "@/lib/assessments/queries";
import AssessmentClient from "./AssessmentClient";

interface Props {
  params: Promise<{ assessmentId: string }>;
}

export default async function AssessmentPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { assessmentId } = await params;
  const id = parseInt(assessmentId, 10);
  if (isNaN(id)) redirect("/dashboard");

  const assessments = await getAllAssessments();
  const assessment = assessments.find((a) => a.id === id);
  if (!assessment) redirect("/dashboard");

  return (
    <AssessmentClient
      assessment={{
        id: assessment.id,
        phaseId: assessment.phaseId,
        assessmentType: assessment.assessmentType,
        title: assessment.title,
        timeLimitMinutes: assessment.timeLimitMinutes,
        exerciseCount: assessment.exerciseCount,
      }}
    />
  );
}
