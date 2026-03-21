"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, HelpCircle, Circle, Trophy, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Phase } from "@/lib/exercises/types";
import type { RecommendationType, RecommendationsResponse } from "@/lib/adaptive/types";
import ExerciseBadge from "@/components/adaptive/ExerciseBadge";

const CAPSTONE_LABELS = [
  { id: "capstone-sales", title: "Sales Dashboard" },
  { id: "capstone-retention", title: "User Retention" },
  { id: "capstone-db-health", title: "DB Health" },
  { id: "capstone-data-quality", title: "Data Quality" },
];

interface Props {
  // NOTE: allPhases contains Exercise objects with expectedSql on the server,
  // but only safe fields are read here: id, title, mode, phase, order, concept.
  readonly allPhases: readonly Phase[];
  readonly currentExerciseId: string;
  readonly isComplete: (id: string) => boolean;
}

export default function CoursePanel({
  allPhases,
  currentExerciseId,
  isComplete,
}: Props) {
  // Fetch adaptive recommendations for inline badges
  const [badges, setBadges] = useState<ReadonlyMap<string, RecommendationType>>(
    new Map()
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/adaptive/recommendations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecommendationsResponse | null) => {
        if (cancelled || !data) return;
        const map = new Map<string, RecommendationType>();
        for (const rec of data.recommendations) {
          // Only set badge if not already set (priority: first recommendation wins)
          if (!map.has(rec.exerciseId)) {
            map.set(rec.exerciseId, rec.type);
          }
        }
        setBadges(map);
      })
      .catch(() => {
        /* best-effort — don't break navigation if fetch fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Regular phases */}
        {allPhases.map((phase) => {
          const totalCount = phase.exercises.length;
          const completedCount = phase.exercises.filter((ex) =>
            isComplete(ex.id)
          ).length;
          const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <div key={phase.id}>
              {/* Phase header */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide truncate">
                  {phase.title}
                </p>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-[var(--accent)] rounded-full overflow-hidden">
                  <div
                    className="h-1 bg-[var(--cta)] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {completedCount}/{totalCount} completed
                </p>
              </div>

              {/* Exercise list */}
              <div className="space-y-0.5">
                {phase.exercises.map((ex) => {
                  const completed = isComplete(ex.id);
                  const current = ex.id === currentExerciseId;
                  const isQuiz = ex.mode === "quiz";

                  return (
                    <Link
                      key={ex.id}
                      href={`/learn/${ex.phase}/${ex.id}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 group ${
                        current
                          ? "bg-[var(--primary)]/15 border-l-2 border-[var(--primary)] pl-1.5"
                          : "hover:bg-[var(--accent)]/50 border-l-2 border-transparent"
                      }`}
                    >
                      {/* Status icon */}
                      <span className="shrink-0">
                        {completed ? (
                          <CheckCircle
                            className="w-3.5 h-3.5 text-[var(--cta)]"
                            aria-label="Completed"
                          />
                        ) : isQuiz ? (
                          <HelpCircle
                            className={`w-3.5 h-3.5 ${current ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}
                            aria-label="Quiz"
                          />
                        ) : (
                          <Circle
                            className={`w-3.5 h-3.5 ${current ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]/50"}`}
                            aria-label="Not completed"
                          />
                        )}
                      </span>

                      {/* Title */}
                      <span
                        className={`truncate leading-tight ${
                          current
                            ? "text-[var(--foreground)] font-medium"
                            : completed
                              ? "text-[var(--foreground)]/80"
                              : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/80"
                        }`}
                      >
                        {ex.title}
                      </span>

                      {/* Adaptive badge */}
                      {badges.has(ex.id) && (
                        <span className="shrink-0 ml-auto">
                          <ExerciseBadge type={badges.get(ex.id)!} />
                        </span>
                      )}

                      {/* Quiz badge */}
                      {isQuiz && !badges.has(ex.id) && (
                        <span className="shrink-0 ml-auto text-[10px] text-[var(--muted-foreground)]/70 font-mono">
                          quiz
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Capstone section */}
        <div>
          <div className="mb-2">
            <p className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-400" />
              Capstones
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              Complete all phases to unlock
            </p>
          </div>
          <div className="space-y-0.5">
            {CAPSTONE_LABELS.map((cap) => {
              // Check if all phases are complete (all phase exercises done)
              const allPhasesComplete = allPhases.every((phase) =>
                phase.exercises.every((ex) => isComplete(ex.id))
              );
              return (
                <div key={cap.id}>
                  {allPhasesComplete ? (
                    <Link
                      href={`/capstone/${cap.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 group hover:bg-[var(--accent)]/50 border-l-2 border-transparent"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate leading-tight text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/80">
                        {cap.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs opacity-40 border-l-2 border-transparent">
                      <Lock className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                      <span className="truncate leading-tight text-[var(--muted-foreground)]">
                        {cap.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
