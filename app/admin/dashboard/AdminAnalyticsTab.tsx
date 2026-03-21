"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingDown, Target, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhaseAnalytics {
  readonly phaseId: string;
  readonly phaseTitle: string;
  readonly totalExercises: number;
  readonly completionRate: number;
  readonly avgCompletionRate: number;
}

interface ExerciseAnalytics {
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly phaseId: string;
  readonly difficulty: string;
  readonly completions: number;
  readonly uniqueAttempts: number;
  readonly avgAttempts: number;
  readonly failRate: number;
  readonly avgHintsUsed: number;
  readonly avgTimeMs: number | null;
}

interface AnalyticsData {
  readonly phases: readonly PhaseAnalytics[];
  readonly hardestExercises: readonly ExerciseAnalytics[];
  readonly totalUniqueUsersWithAttempts: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function difficultyBadge(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return "text-emerald-400";
    case "intermediate":
      return "text-amber-400";
    case "advanced":
      return "text-red-400";
    default:
      return "text-[var(--muted-foreground)]";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminAnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json as AnalyticsData);
      setError(null);
    } catch {
      setError("Failed to load exercise analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-400">{error}</div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Target className="w-4 h-4" />
        <span>{data.totalUniqueUsersWithAttempts} users have completed at least one exercise</span>
      </div>

      {/* Phase Completion Overview */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--cta)]" />
          Phase Completion Rates
        </h3>
        <div className="space-y-3">
          {data.phases.map((phase) => (
            <div key={phase.phaseId} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {phase.phaseTitle}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {phase.totalExercises} exercises · {phase.avgCompletionRate}% avg completion
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--background)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(phase.avgCompletionRate, 100)}%`,
                    backgroundColor: "var(--cta)",
                    opacity: phase.avgCompletionRate > 0 ? 1 : 0.2,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-[var(--muted-foreground)]">
                <span>Full phase completion: {phase.completionRate}%</span>
                <span>Avg exercise completion: {phase.avgCompletionRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hardest Exercises */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-400" />
          Top 10 Hardest Exercises
        </h3>

        {data.hardestExercises.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No attempt data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">Exercise</th>
                  <th className="py-2 pr-3 font-medium">Phase</th>
                  <th className="py-2 pr-3 font-medium">Difficulty</th>
                  <th className="py-2 pr-3 font-medium text-right">Fail Rate</th>
                  <th className="py-2 pr-3 font-medium text-right">Avg Attempts</th>
                  <th className="py-2 pr-3 font-medium text-right">Avg Hints</th>
                  <th className="py-2 font-medium text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {data.hardestExercises.map((ex) => (
                  <tr
                    key={ex.exerciseId}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[var(--foreground)]">{ex.exerciseTitle}</td>
                    <td className="py-2 pr-3 text-[var(--muted-foreground)]">{ex.phaseId}</td>
                    <td className={`py-2 pr-3 capitalize ${difficultyBadge(ex.difficulty)}`}>
                      {ex.difficulty}
                    </td>
                    <td className="py-2 pr-3 text-right text-red-400 font-medium">
                      {ex.failRate}%
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {ex.avgAttempts}
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {ex.avgHintsUsed}
                    </td>
                    <td className="py-2 text-right text-[var(--muted-foreground)]">
                      {formatTime(ex.avgTimeMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
