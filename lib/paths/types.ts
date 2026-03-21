export interface LearningPath {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedHours: number;
  readonly targetRole: string;
}

export interface LearningPathPhase {
  readonly phaseId: string;
  readonly phaseOrder: number;
  readonly milestoneLabel: string | null;
}

export interface LearningPathWithPhases extends LearningPath {
  readonly phases: readonly LearningPathPhase[];
}

export interface UserPathProgress {
  readonly pathId: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

/** Client-safe path data with computed progress */
export interface PathProgressData {
  readonly path: LearningPathWithPhases;
  readonly enrollment: UserPathProgress | null;
  readonly phasesCompleted: number;
  readonly totalPhases: number;
  readonly exercisesCompleted: number;
  readonly totalExercises: number;
  readonly currentMilestone: string | null;
  readonly nextMilestone: string | null;
}
