import { getAdminPool } from "@/lib/db/pool";
import type {
  LearningPathWithPhases,
  UserPathProgress,
  PathProgressData,
} from "./types";
import { ALL_PHASES } from "@/lib/exercises/loader";

/** Fetch all learning paths with their phases from the database */
export async function getAllPaths(): Promise<readonly LearningPathWithPhases[]> {
  const pool = getAdminPool();

  const [pathsResult, phasesResult] = await Promise.all([
    pool.query(
      `SELECT id, slug, title, description, estimated_hours, target_role
       FROM learning_paths ORDER BY id`
    ),
    pool.query(
      `SELECT path_id, phase_id, phase_order, milestone_label
       FROM learning_path_phases ORDER BY path_id, phase_order`
    ),
  ]);

  const phasesByPath = new Map<number, typeof phasesResult.rows>();
  for (const row of phasesResult.rows) {
    const pathId = row.path_id as number;
    const existing = phasesByPath.get(pathId) ?? [];
    existing.push(row);
    phasesByPath.set(pathId, existing);
  }

  return pathsResult.rows.map((row) => ({
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    estimatedHours: row.estimated_hours as number,
    targetRole: row.target_role as string,
    phases: (phasesByPath.get(row.id as number) ?? []).map((p) => ({
      phaseId: p.phase_id as string,
      phaseOrder: p.phase_order as number,
      milestoneLabel: (p.milestone_label as string) ?? null,
    })),
  }));
}

/** Fetch a single learning path by slug */
export async function getPathBySlug(
  slug: string
): Promise<LearningPathWithPhases | null> {
  const paths = await getAllPaths();
  return paths.find((p) => p.slug === slug) ?? null;
}

/** Fetch user's enrollment progress for all paths */
export async function getUserPathProgress(
  userId: number
): Promise<readonly UserPathProgress[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT path_id, started_at, completed_at
     FROM user_path_progress WHERE user_id = $1`,
    [userId]
  );

  return result.rows.map((row) => ({
    pathId: row.path_id as number,
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? null,
  }));
}

/** Enroll a user in a learning path */
export async function enrollUserInPath(
  userId: number,
  pathId: number
): Promise<UserPathProgress> {
  const pool = getAdminPool();
  const result = await pool.query(
    `INSERT INTO user_path_progress (user_id, path_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, path_id) DO NOTHING
     RETURNING started_at, completed_at`,
    [userId, pathId]
  );

  if (result.rows.length === 0) {
    // Already enrolled — fetch existing
    const existing = await pool.query(
      `SELECT started_at, completed_at FROM user_path_progress
       WHERE user_id = $1 AND path_id = $2`,
      [userId, pathId]
    );
    return {
      pathId,
      startedAt: existing.rows[0].started_at as string,
      completedAt: (existing.rows[0].completed_at as string) ?? null,
    };
  }

  return {
    pathId,
    startedAt: result.rows[0].started_at as string,
    completedAt: null,
  };
}

/** Compute path progress data for a user */
export async function computePathProgress(
  userId: number,
  path: LearningPathWithPhases,
  completedExerciseIds: ReadonlySet<string>
): Promise<PathProgressData> {
  const enrollments = await getUserPathProgress(userId);
  const enrollment = enrollments.find((e) => e.pathId === path.id) ?? null;

  let phasesCompleted = 0;
  let exercisesCompleted = 0;
  let totalExercises = 0;
  let currentMilestone: string | null = null;
  let nextMilestone: string | null = null;

  for (const pathPhase of path.phases) {
    const phase = ALL_PHASES.find((p) => p.id === pathPhase.phaseId);
    if (!phase) continue;

    const phaseTotal = phase.exercises.length;
    const phaseDone = phase.exercises.filter((e) =>
      completedExerciseIds.has(e.id)
    ).length;

    totalExercises += phaseTotal;
    exercisesCompleted += phaseDone;

    if (phaseDone === phaseTotal) {
      phasesCompleted++;
      if (pathPhase.milestoneLabel) {
        currentMilestone = pathPhase.milestoneLabel;
      }
    } else if (!nextMilestone && pathPhase.milestoneLabel) {
      nextMilestone = pathPhase.milestoneLabel;
    }
  }

  return {
    path,
    enrollment,
    phasesCompleted,
    totalPhases: path.phases.length,
    exercisesCompleted,
    totalExercises,
    currentMilestone,
    nextMilestone,
  };
}
