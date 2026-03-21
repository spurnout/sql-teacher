"use client";

import { useState, useEffect, useCallback } from "react";
import type { BadgeId } from "@/lib/exercises/types";

interface ProgressData {
  readonly completedExercises: Record<string, { readonly completedAt: string }>;
  readonly solutionViews: Record<string, { readonly viewedAt: string }>;
}

export interface ProgressResult {
  readonly ok: boolean;
  readonly xpEarned: number;
  readonly newBadges: readonly BadgeId[];
  readonly streak: number;
}

export function useProgress(initialCompletedIds?: readonly string[]) {
  const [progress, setProgress] = useState<ProgressData>(() => {
    // Seed initial state from pre-fetched IDs if provided
    const completedExercises: Record<string, { completedAt: string }> = {};
    if (initialCompletedIds) {
      for (const id of initialCompletedIds) {
        completedExercises[id] = { completedAt: "" };
      }
    }
    return { completedExercises, solutionViews: {} };
  });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Load from server on mount
  useEffect(() => {
    fetch("/api/progress")
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setProgress({
          completedExercises: data.completed ?? {},
          solutionViews: data.solutionViews ?? {},
        });
        setLoadError(false);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
  }, []);

  const markComplete = useCallback(
    async (exerciseId: string): Promise<ProgressResult | null> => {
      // Optimistic update
      setProgress((prev) => ({
        ...prev,
        completedExercises: {
          ...prev.completedExercises,
          [exerciseId]: { completedAt: new Date().toISOString() },
        },
      }));

      // Persist to server and return XP/badge data
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseId }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
          ok: data.ok ?? true,
          xpEarned: data.xpEarned ?? 0,
          newBadges: data.newBadges ?? [],
          streak: data.streak ?? 0,
        };
      } catch {
        return null;
      }
    },
    []
  );

  const isComplete = useCallback(
    (exerciseId: string): boolean => {
      return exerciseId in progress.completedExercises;
    },
    [progress]
  );

  const completedCount = Object.keys(progress.completedExercises).length;

  return {
    markComplete,
    isComplete,
    progress,
    completedCount,
    loaded,
    loadError,
  };
}
