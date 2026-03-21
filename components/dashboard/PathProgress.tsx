"use client";

import { useState, useCallback } from "react";
import { Map, Target, ChevronRight, Clock, CheckCircle } from "lucide-react";

interface PathPhase {
  readonly phaseId: string;
  readonly phaseOrder: number;
  readonly milestoneLabel: string | null;
}

interface PathData {
  readonly path: {
    readonly id: number;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly estimatedHours: number;
    readonly targetRole: string;
    readonly phases: readonly PathPhase[];
  };
  readonly enrollment: {
    readonly pathId: number;
    readonly startedAt: string;
    readonly completedAt: string | null;
  } | null;
  readonly phasesCompleted: number;
  readonly totalPhases: number;
  readonly exercisesCompleted: number;
  readonly totalExercises: number;
  readonly currentMilestone: string | null;
  readonly nextMilestone: string | null;
}

interface Props {
  readonly paths: readonly PathData[];
}

export default function PathProgress({ paths }: Props) {
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const handleEnroll = useCallback(async (pathId: number) => {
    setEnrollingId(pathId);
    try {
      await fetch("/api/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathId }),
      });
      // Reload to reflect enrollment
      window.location.reload();
    } catch {
      setEnrollingId(null);
    }
  }, []);

  if (paths.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Learning Paths</h2>
      <div className="space-y-4">
        {paths.map((data) => {
          const pct =
            data.totalExercises > 0
              ? (data.exercisesCompleted / data.totalExercises) * 100
              : 0;
          const isEnrolled = data.enrollment !== null;
          const isComplete = data.enrollment?.completedAt !== null && data.enrollment?.completedAt !== undefined;

          return (
            <div
              key={data.path.id}
              className={`bg-[var(--card)] border rounded-lg p-5 transition-all ${
                isComplete
                  ? "border-[var(--cta)] bg-[var(--cta)]/5"
                  : "border-[var(--border)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold">{data.path.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  ~{data.path.estimatedHours}h
                </div>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                {data.path.description}
              </p>

              {isEnrolled ? (
                <>
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {data.phasesCompleted}/{data.totalPhases} phases
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {data.exercisesCompleted}/{data.totalExercises} exercises
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            isComplete ? "var(--cta)" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="flex items-center gap-3 text-xs">
                    {data.currentMilestone && (
                      <span className="flex items-center gap-1 text-[var(--cta)]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {data.currentMilestone}
                      </span>
                    )}
                    {data.nextMilestone && (
                      <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <ChevronRight className="w-3.5 h-3.5" />
                        Next: {data.nextMilestone}
                      </span>
                    )}
                    {isComplete && (
                      <span className="flex items-center gap-1 text-[var(--cta)] font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Path Complete!
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* Enroll button */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <Target className="w-3.5 h-3.5" aria-hidden="true" />
                    Target: {data.path.targetRole}
                  </div>
                  <button
                    onClick={() => handleEnroll(data.path.id)}
                    disabled={enrollingId === data.path.id}
                    className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {enrollingId === data.path.id
                      ? "Enrolling..."
                      : "Start Path"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
