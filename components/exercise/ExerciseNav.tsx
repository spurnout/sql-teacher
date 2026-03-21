"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Database, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientExercise, Phase } from "@/lib/exercises/types";

interface Props {
  readonly exercise: ClientExercise;
  readonly allPhases: readonly Phase[];
  readonly username: string;
  readonly totalXP?: number;
  readonly currentStreak?: number;
  readonly isComplete: (id: string) => boolean;
  readonly completedCount: number;
}

export default function ExerciseNav({
  exercise,
  allPhases,
  username,
  totalXP = 0,
  currentStreak = 0,
  isComplete,
  completedCount,
}: Props) {

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const allExercises = useMemo(
    () => allPhases.flatMap((p) =>
      p.exercises.map((e) => ({ exercise: e, phaseId: p.id }))
    ),
    [allPhases]
  );
  const totalCount = allExercises.length;
  const currentIndex = allExercises.findIndex(
    (e) => e.exercise.id === exercise.id
  );
  const prev = currentIndex > 0 ? allExercises[currentIndex - 1] : null;
  const next =
    currentIndex < allExercises.length - 1
      ? allExercises[currentIndex + 1]
      : null;

  const currentPhase = allPhases.find((p) => p.id === exercise.phase);

  // Worked examples have no validation gate — always allow navigation
  const exerciseDone =
    exercise.mode === "worked-example" || isComplete(exercise.id);

  return (
    <nav
      className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]"
      aria-label="Exercise navigation"
    >
      {/* Left: prev/next + branding + phase */}
      <div className="flex items-center gap-2 min-w-0">
        {prev ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/learn/${prev.exercise.phase}/${prev.exercise.id}`}>
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back
            </Link>
          </Button>
        ) : (
          <div className="w-[60px]" />
        )}
        {next ? (
          exerciseDone ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/learn/${next.exercise.phase}/${next.exercise.id}`}>
                Next
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-40 cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )
        ) : (
          <div className="w-[60px]" />
        )}
        <span className="text-[var(--border)] text-xs ml-1" aria-hidden="true">
          |
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">
            SQL Teacher
          </span>
        </div>
        <span className="text-[var(--border)] text-xs" aria-hidden="true">
          /
        </span>
        <span className="text-xs text-[var(--muted-foreground)] truncate">
          {currentPhase?.title ?? exercise.phase}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]/60 shrink-0">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Center: XP + streak + exercise title */}
      <div className="hidden md:flex items-center gap-3">
        {totalXP > 0 && (
          <span className="text-xs font-medium text-amber-400 shrink-0">
            ⚡ {totalXP} XP
          </span>
        )}
        {currentStreak > 0 && (
          <span className="text-xs font-medium text-orange-400 shrink-0">
            🔥 {currentStreak}
          </span>
        )}
        <p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs text-center">
          {exercise.title}
        </p>
      </div>

      {/* Right: user controls */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Progress dashboard"
        >
          <BarChart2 className="w-4 h-4" aria-hidden="true" />
        </Link>
        <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--foreground)]"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
