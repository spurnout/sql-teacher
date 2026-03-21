"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Trophy, Target } from "lucide-react";
import type { GolfRecord } from "@/lib/challenges/types";

interface ExerciseInfo {
  readonly id: string;
  readonly title: string;
  readonly phase: string;
  readonly phaseTitle: string;
  readonly concept: string;
}

interface Props {
  readonly username: string;
  readonly exercises: readonly ExerciseInfo[];
}

export default function GolfClient({ username, exercises }: Props) {
  const [records, setRecords] = useState<readonly GolfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Load golf records
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/challenges/golf");
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records ?? []);
        }
      } catch {
        // Fail silently — records will show empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const recordsByExercise = new Map(records.map((r) => [r.exerciseId, r]));

  // Group exercises by phase
  const phaseGroups = new Map<string, { title: string; exercises: ExerciseInfo[] }>();
  for (const ex of exercises) {
    const group = phaseGroups.get(ex.phase);
    if (group) {
      group.exercises.push(ex);
    } else {
      phaseGroups.set(ex.phase, { title: ex.phaseTitle, exercises: [ex] });
    }
  }

  const totalRecords = records.length;
  const totalExercises = exercises.length;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" />
          <span className="font-semibold text-sm">SQL Golf</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏌️</div>
          <h1 className="text-2xl font-bold mb-2">SQL Golf</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Solve exercises with the fewest characters. Write elegant, concise SQL.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Target className="w-5 h-5 text-[var(--cta)] mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalRecords}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Records Set / {totalExercises} exercises
            </p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {records.length > 0
                ? Math.min(...records.map((r) => r.charCount))
                : "—"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Shortest Solution (chars)
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-[var(--muted-foreground)]">Loading...</p>
        ) : (
          <div className="space-y-6">
            {Array.from(phaseGroups.entries()).map(([phaseId, group]) => (
              <div key={phaseId}>
                <h2 className="text-sm font-semibold mb-3">{group.title}</h2>
                <div className="space-y-2">
                  {group.exercises.map((ex) => {
                    const record = recordsByExercise.get(ex.id);
                    return (
                      <Link
                        key={ex.id}
                        href={`/learn/${ex.phase}/${ex.id}`}
                        className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 hover:border-[var(--border)]/80 hover:bg-[var(--accent)]/20 transition-all"
                      >
                        <div>
                          <p className="text-sm font-medium">{ex.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{ex.concept}</p>
                        </div>
                        <div className="text-right">
                          {record ? (
                            <div>
                              <p className="text-sm font-mono font-bold text-[var(--cta)]">
                                {record.charCount} chars
                              </p>
                              <p className="text-[10px] text-[var(--muted-foreground)]">
                                Personal best
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--muted-foreground)]">No record yet</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
