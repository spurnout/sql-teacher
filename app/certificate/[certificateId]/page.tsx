import { notFound } from "next/navigation";
import { getAdminPool } from "@/lib/db/pool";
import CertificateClient from "./CertificateClient";

interface Props {
  params: Promise<{ certificateId: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { certificateId } = await params;

  // UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(certificateId)) notFound();

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT c.certificate_id, c.issued_at, c.total_xp, c.level, c.capstone_data,
            c.user_id, u.username
     FROM user_certificates c
     JOIN app_users u ON u.id = c.user_id
     WHERE c.certificate_id = $1`,
    [certificateId]
  );

  if (result.rows.length === 0) notFound();

  const row = result.rows[0];
  const userId = row.user_id as number;

  // Fetch learning path name (if enrolled and completed)
  const pathResult = await pool.query(
    `SELECT lp.title
     FROM user_path_progress upp
     JOIN learning_paths lp ON lp.id = upp.path_id
     WHERE upp.user_id = $1 AND upp.completed_at IS NOT NULL
     ORDER BY upp.completed_at DESC
     LIMIT 1`,
    [userId]
  );
  const learningPath = (pathResult.rows[0]?.title as string) ?? null;

  // Fetch assessment exit scores
  const assessmentResult = await pool.query(
    `SELECT a.phase_id, a.assessment_type, ar.score_pct
     FROM assessment_results ar
     JOIN assessments a ON a.id = ar.assessment_id
     WHERE ar.user_id = $1
     ORDER BY ar.completed_at DESC`,
    [userId]
  );

  // Build per-phase assessment scores (use latest result per type)
  const scoreMap = new Map<
    string,
    { entryScore: number | null; exitScore: number | null }
  >();
  for (const aRow of assessmentResult.rows) {
    const phaseId = aRow.phase_id as string;
    const type = aRow.assessment_type as string;
    const score = aRow.score_pct as number;

    const existing = scoreMap.get(phaseId) ?? {
      entryScore: null,
      exitScore: null,
    };
    if (type === "entry" && existing.entryScore === null) {
      existing.entryScore = score;
    } else if (type === "exit" && existing.exitScore === null) {
      existing.exitScore = score;
    }
    scoreMap.set(phaseId, existing);
  }

  const assessmentScores = [...scoreMap.entries()].map(
    ([phaseId, scores]) => ({
      phaseId,
      ...scores,
    })
  );

  return (
    <CertificateClient
      certificateId={row.certificate_id}
      username={row.username}
      issuedAt={row.issued_at.toISOString()}
      totalXP={row.total_xp}
      level={row.level}
      capstoneData={row.capstone_data}
      learningPath={learningPath}
      assessmentScores={assessmentScores}
    />
  );
}
