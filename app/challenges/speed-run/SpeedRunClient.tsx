"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, Timer, CheckCircle, Trophy, Play, XCircle } from "lucide-react";
import SqlEditor from "@/components/editor/SqlEditor";
import ResultsTable from "@/components/editor/ResultsTable";
import type { ExecutionState } from "@/components/editor/ResultsTable";
import type { SpeedRunSession, SpeedRunPersonalBest } from "@/lib/challenges/types";

interface PhaseSummary {
  readonly id: string;
  readonly title: string;
  readonly exerciseCount: number;
}

interface Props {
  readonly username: string;
  readonly phaseSummaries: readonly PhaseSummary[];
}

interface ExerciseData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly starterSql?: string;
  readonly phase: string;
}

export default function SpeedRunClient({
  username,
  phaseSummaries,
}: Props) {
  const router = useRouter();

  // State
  const [session, setSession] = useState<SpeedRunSession | null>(null);
  const [personalBests, setPersonalBests] = useState<readonly SpeedRunPersonalBest[]>([]);
  const [selectedPhase, setSelectedPhase] = useState(phaseSummaries[0]?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active session state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [sql, setSql] = useState("");
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ passed: boolean; error?: string } | null>(null);
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(new Set());

  // Timer
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial state
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/challenges/speed-run");
        const data = await res.json();
        if (data.activeSession) {
          setSession(data.activeSession);
          await loadSessionExercises(data.activeSession);
        }
        setPersonalBests(data.personalBests ?? []);
      } catch {
        setError("Failed to load speed run data.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer effect
  useEffect(() => {
    if (!session || session.completedAt) return;

    const startedAt = new Date(session.startedAt).getTime();
    const deadline = startedAt + session.timeLimitMs;

    function tick() {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      setRemainingMs(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    tick();
    timerRef.current = setInterval(tick, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  async function loadSessionExercises(sess: SpeedRunSession) {
    // Fetch exercise details for each ID
    const exerciseData: ExerciseData[] = [];
    for (const eid of sess.exerciseIds) {
      try {
        const res = await fetch(`/api/solution?exerciseId=${eid}&phase=${sess.phaseId}`);
        if (res.ok) {
          const data = await res.json();
          exerciseData.push({
            id: eid,
            title: data.title ?? eid,
            description: data.description ?? "",
            starterSql: data.starterSql,
            phase: sess.phaseId,
          });
        } else {
          exerciseData.push({ id: eid, title: eid, description: "", phase: sess.phaseId });
        }
      } catch {
        exerciseData.push({ id: eid, title: eid, description: "", phase: sess.phaseId });
      }
    }
    setExercises(exerciseData);
    const firstUncompleted = exerciseData.findIndex(
      (_, i) => i >= sess.exercisesCompleted
    );
    const idx = firstUncompleted >= 0 ? firstUncompleted : 0;
    setCurrentExerciseIndex(idx);
    setSql(exerciseData[idx]?.starterSql ?? "");

    // Mark already completed exercises
    const done = new Set<string>();
    for (let i = 0; i < sess.exercisesCompleted; i++) {
      done.add(sess.exerciseIds[i]);
    }
    setCompletedInSession(done);
  }

  const handleStartRun = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/challenges/speed-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: selectedPhase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start speed run.");
        setStarting(false);
        return;
      }
      setSession(data.session);
      await loadSessionExercises(data.session);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStarting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhase]);

  const handleRunQuery = useCallback(async () => {
    setIsRunning(true);
    setExecution({ status: "running" });
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, exerciseId: exercises[currentExerciseIndex]?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setExecution({
          status: "success",
          rows: data.rows,
          fields: data.fields,
          duration: data.duration,
          rowCount: data.rowCount,
        });
      } else {
        setExecution({ status: "error", message: data.error ?? "Query execution failed." });
      }
    } catch {
      setExecution({ status: "error", message: "Network error running query." });
    } finally {
      setIsRunning(false);
    }
  }, [sql, exercises, currentExerciseIndex]);

  const handleValidate = useCallback(async () => {
    if (!session || !exercises[currentExerciseIndex]) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const ex = exercises[currentExerciseIndex];
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: ex.id,
          phase: session.phaseId,
          userSql: sql,
        }),
      });
      const data = await res.json();
      setValidationResult({ passed: data.passed, error: data.error });

      if (data.passed) {
        // Mark step complete
        const completeRes = await fetch("/api/challenges/speed-run/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            exerciseId: ex.id,
          }),
        });
        const completeData = await completeRes.json();
        if (completeRes.ok) {
          setSession(completeData.session);
          setCompletedInSession((prev) => new Set([...prev, ex.id]));

          // Auto-advance to next exercise after a brief delay
          if (!completeData.session.completedAt) {
            setTimeout(() => {
              const nextIdx = currentExerciseIndex + 1;
              if (nextIdx < exercises.length) {
                setCurrentExerciseIndex(nextIdx);
                setSql(exercises[nextIdx]?.starterSql ?? "");
                setExecution({ status: "idle" });
                setValidationResult(null);
              }
            }, 1000);
          }
        }
      }
    } catch {
      setValidationResult({ passed: false, error: "Network error validating." });
    } finally {
      setIsValidating(false);
    }
  }, [session, exercises, currentExerciseIndex, sql]);

  // Format time
  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function formatBestTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  // Completed state
  if (session?.completedAt) {
    const allDone = session.exercisesCompleted === session.exerciseIds.length;
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[var(--cta)]" />
            <span className="font-semibold text-sm">Speed Run</span>
          </div>
          <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
        </nav>
        <main className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="text-5xl mb-4">{allDone ? "🏆" : "⏱️"}</div>
          <h1 className="text-2xl font-bold mb-2">
            {allDone ? "Speed Run Complete!" : "Time's Up!"}
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            {session.exercisesCompleted}/{session.exerciseIds.length} exercises completed
            {session.elapsedMs != null && ` in ${formatBestTime(session.elapsedMs)}`}
          </p>
          {allDone && (
            <p className="text-amber-400 text-sm font-medium mb-6">+50 XP earned!</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setSession(null);
                setExercises([]);
                setCompletedInSession(new Set());
                setValidationResult(null);
                setExecution({ status: "idle" });
              }}
              className="px-4 py-2 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] text-sm font-medium hover:brightness-105 cursor-pointer"
            >
              New Speed Run
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Active session
  if (session && exercises.length > 0) {
    const currentExercise = exercises[currentExerciseIndex];
    const isTimedOut = remainingMs <= 0;
    const timerColor = remainingMs < 60_000 ? "text-red-400" : remainingMs < 180_000 ? "text-amber-400" : "text-[var(--cta)]";

    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-[var(--cta)]" />
            <span className="font-semibold text-sm">Speed Run</span>
            <span className="text-[var(--border)] text-xs">/</span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {phaseSummaries.find((p) => p.id === session.phaseId)?.title ?? session.phaseId}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timerColor}`}>
              <Timer className="w-4 h-4" />
              {formatTime(remainingMs)}
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden">
          {/* Exercise sidebar */}
          <div className="w-56 border-r border-[var(--border)] bg-[var(--card)] p-4 shrink-0 overflow-y-auto">
            <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide mb-3">
              Exercises ({session.exercisesCompleted}/{session.exerciseIds.length})
            </p>
            <div className="space-y-2">
              {exercises.map((ex, i) => {
                const isDone = completedInSession.has(ex.id);
                const isCurrent = i === currentExerciseIndex;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      if (!isDone && !isTimedOut) {
                        setCurrentExerciseIndex(i);
                        setSql(ex.starterSql ?? "");
                        setExecution({ status: "idle" });
                        setValidationResult(null);
                      }
                    }}
                    disabled={isDone || isTimedOut}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-[var(--cta)]/10 border border-[var(--cta)]/30 text-[var(--foreground)]"
                        : isDone
                          ? "bg-[var(--cta)]/5 text-[var(--cta)] opacity-70"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--cta)] shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[var(--border)] shrink-0 inline-block" />
                      )}
                      <span className="truncate">{i + 1}. {ex.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Exercise description */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
              <h2 className="text-sm font-semibold mb-1">{currentExercise?.title}</h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
                {currentExercise?.description?.replace(/[#*`]/g, "")}
              </p>
            </div>

            {/* Validation feedback */}
            {validationResult && (
              <div
                className={`px-6 py-2 text-xs font-medium ${
                  validationResult.passed
                    ? "bg-[var(--cta)]/10 text-[var(--cta)]"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {validationResult.passed ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Correct! Moving to next...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> {validationResult.error ?? "Not quite. Try again!"}
                  </span>
                )}
              </div>
            )}

            {/* Editor */}
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRunQuery}
              isRunning={isRunning}
            />

            {/* Check answer button */}
            <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating || isTimedOut || !sql.trim()}
                className="px-4 py-1.5 rounded text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isValidating ? "Checking..." : "Check Answer"}
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto">
              <ResultsTable execution={execution} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phase selection (no active session)
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" />
          <span className="font-semibold text-sm">Speed Run</span>
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

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold mb-2">Speed Run</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Complete 5 exercises as fast as you can. 10-minute time limit.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-4 text-center">
            {error}
          </p>
        )}

        {/* Phase selector */}
        <div className="mb-6">
          <label className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide block mb-2">
            Choose a Phase
          </label>
          <div className="space-y-2">
            {phaseSummaries.map((phase) => (
              <button
                key={phase.id}
                type="button"
                onClick={() => setSelectedPhase(phase.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                  selectedPhase === phase.id
                    ? "border-[var(--cta)] bg-[var(--cta)]/5"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]/80"
                }`}
              >
                <p className="text-sm font-medium">{phase.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {phase.exerciseCount} eligible exercises
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={handleStartRun}
          disabled={starting || !selectedPhase}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--cta)] text-[var(--cta-foreground)] text-sm font-medium hover:brightness-105 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4" />
          {starting ? "Starting..." : "Start Speed Run"}
        </button>

        {/* Personal Bests */}
        {personalBests.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold mb-3">Personal Bests</h2>
            <div className="space-y-2">
              {personalBests.map((pb) => {
                const phaseName = phaseSummaries.find((p) => p.id === pb.phaseId)?.title ?? pb.phaseId;
                return (
                  <div
                    key={pb.phaseId}
                    className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-sm">{phaseName}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[var(--cta)]">
                      {formatBestTime(pb.bestElapsedMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
