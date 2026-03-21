"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Lock, Loader2 } from "lucide-react";
import type { ClientScenario, ScenarioProgress } from "@/lib/scenarios/types";

interface ScenarioWithProgress {
  readonly id: string;
  readonly title: string;
  readonly narrative: string;
  readonly concept: string;
  readonly difficulty: string;
  readonly steps: readonly { readonly stepIndex: number }[];
  readonly progress: ScenarioProgress | null;
}

export default function ScenariosSection() {
  const [scenarios, setScenarios] = useState<readonly ScenarioWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setScenarios(data.scenarios ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load scenarios.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-base font-semibold mb-4">Scenarios</h2>
        <div className="flex items-center justify-center py-8 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-base font-semibold mb-2">Scenarios</h2>
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-2">Scenarios</h2>
      <p className="text-xs text-[var(--muted-foreground)] mb-4">
        Multi-step analytical challenges that simulate real-world data tasks.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {scenarios.map((s) => {
          const totalSteps = s.steps.length;
          const completedSteps = s.progress?.stepsCompleted.length ?? 0;
          const isComplete = s.progress?.completedAt != null;
          const isStarted = s.progress != null;
          const pct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <div
              key={s.id}
              className={`bg-[var(--card)] border rounded-lg p-4 transition-all ${
                isComplete
                  ? "border-[var(--cta)] bg-[var(--cta)]/5"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isComplete ? (
                  <CheckCircle
                    className="w-4 h-4 text-[var(--cta)]"
                    aria-hidden="true"
                  />
                ) : (
                  <BookOpen
                    className="w-4 h-4 text-[var(--primary)]"
                    aria-hidden="true"
                  />
                )}
                <p className="text-sm font-medium">{s.title}</p>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">
                {s.concept} · {totalSteps} steps ·{" "}
                <span className="capitalize">{s.difficulty}</span>
              </p>

              <div className="h-1.5 bg-[var(--accent)] rounded-full overflow-hidden mb-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isComplete
                      ? "var(--cta)"
                      : "var(--primary)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {completedSteps}/{totalSteps} steps
                </p>
                {isComplete ? (
                  <span className="flex items-center gap-1 text-xs text-[var(--cta)] font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Complete
                  </span>
                ) : (
                  <Link
                    href={`/scenario/${s.id}`}
                    className="text-xs text-[var(--primary)] hover:text-[var(--foreground)] font-medium transition-colors"
                  >
                    {isStarted ? "Resume" : "Start"} →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
