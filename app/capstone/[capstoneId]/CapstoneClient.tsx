"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import SqlEditor from "@/components/editor/SqlEditor";
import ResultsTable from "@/components/editor/ResultsTable";
import type { ExecutionState } from "@/components/editor/ResultsTable";
import SchemaSidebar from "@/components/layout/SchemaSidebar";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { useProgress } from "@/lib/progress/storage";
import { useGamification } from "@/lib/gamification/useGamification";
import XPToast from "@/components/ui/XPToast";
import type { ClientExercise, BadgeId } from "@/lib/exercises/types";
import {
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ArrowLeft,
  Trophy,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CapstoneInfo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

interface Props {
  readonly capstone: CapstoneInfo;
  readonly exercises: readonly ClientExercise[];
  readonly username: string;
  readonly initialCompletedIds: readonly string[];
  readonly startedAt: string;
}

type ValidationStatus = "idle" | "checking" | "passed" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-[var(--cta)] border-[var(--cta)]/30 bg-[var(--cta)]/10",
  intermediate: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  advanced: "text-red-400 border-red-400/30 bg-red-400/10",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CapstoneClient({
  capstone,
  exercises,
  username,
  initialCompletedIds,
  startedAt,
}: Props) {
  // ---- state ----
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sql, setSql] = useState("");
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });
  const [validation, setValidation] = useState<{
    status: ValidationStatus;
    error?: string;
  }>({ status: "idle" });
  const [capstoneComplete, setCapstoneComplete] = useState(false);
  const [completeError, setCompleteError] = useState(false);
  const [xpToast, setXpToast] = useState<{
    xpEarned: number;
    newBadges: BadgeId[];
  } | null>(null);

  // ---- hooks ----
  const { markComplete, isComplete } = useProgress(initialCompletedIds);
  const gamification = useGamification();

  // ---- timer ----
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(new Date(startedAt).getTime());

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ---- derived ----
  const selectedExercise = exercises[selectedIndex];
  const completedCount = exercises.filter((e) => isComplete(e.id)).length;
  const allComplete = completedCount === exercises.length;

  // ---- reset editor on exercise switch ----
  useEffect(() => {
    setSql(selectedExercise?.starterSql ?? "");
    setExecution({ status: "idle" });
    setValidation({ status: "idle" });
  }, [selectedIndex, selectedExercise?.id, selectedExercise?.starterSql]);

  // ---- auto-complete capstone when all exercises pass ----
  useEffect(() => {
    if (!allComplete || capstoneComplete) return;
    setCompleteError(false);
    fetch("/api/capstone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capstoneId: capstone.id, action: "complete" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setCapstoneComplete(true);
        else setCompleteError(true);
      })
      .catch(() => setCompleteError(true));
  }, [allComplete, capstoneComplete, capstone.id]);

  // ---- handlers ----
  const runQuery = useCallback(async () => {
    setExecution({ status: "running" });
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExecution({ status: "error", message: data.error });
      } else {
        setExecution({ status: "success", ...data });
      }
    } catch {
      setExecution({ status: "error", message: "Network error" });
    }
  }, [sql]);

  const validateAnswer = useCallback(async () => {
    if (!selectedExercise) return;
    setValidation({ status: "checking" });
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: selectedExercise.id,
          phase: selectedExercise.phase,
          userSql: sql,
        }),
      });
      const data = await res.json();
      if (data.passed) {
        setValidation({ status: "passed" });
        const result = await markComplete(selectedExercise.id);
        if (result && result.xpEarned > 0) {
          gamification.applyXPEvent(result);
          setXpToast({
            xpEarned: result.xpEarned,
            newBadges: result.newBadges as BadgeId[],
          });
        }
      } else {
        setValidation({ status: "failed", error: data.error });
      }
    } catch {
      setValidation({ status: "failed", error: "Network error" });
    }
  }, [sql, selectedExercise, markComplete, gamification]);

  if (!selectedExercise) return null;

  const difficultyClass =
    DIFFICULTY_COLORS[selectedExercise.difficulty] ??
    "text-[var(--muted-foreground)] border-[var(--border)]";

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* ── Nav bar ── */}
      <nav className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Dashboard
          </Link>
          <span className="text-[var(--border)]" aria-hidden="true">
            /
          </span>
          <Database
            className="w-3.5 h-3.5 text-[var(--cta)]"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold">{capstone.title}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {formatElapsed(elapsed)}
          </div>
          <span className="text-xs text-amber-400 font-medium">
            ⚡ {gamification.totalXP} XP
          </span>
          {gamification.streak.current > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              🔥 {gamification.streak.current}
            </span>
          )}
          <span className="text-xs text-[var(--muted-foreground)]">
            {username}
          </span>
        </div>
      </nav>

      {/* ── Main content ── */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* ── Left: exercise selector + description ── */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="h-full flex flex-col bg-[var(--card)]">
            {/* Progress bar */}
            <div className="p-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Progress
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {completedCount}/{exercises.length}
                </p>
              </div>
              <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[var(--cta)] rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / exercises.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Exercise step list */}
            <div className="p-2 border-b border-[var(--border)] shrink-0 space-y-0.5">
              {exercises.map((ex, i) => {
                const done = isComplete(ex.id);
                const active = i === selectedIndex;
                return (
                  <button
                    key={ex.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-xs transition-colors cursor-pointer ${
                      active
                        ? "bg-[var(--primary)]/15 text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/30"
                    }`}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-[var(--cta)]" />
                      ) : (
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            active
                              ? "border-[var(--primary)] text-[var(--primary)]"
                              : "border-[var(--border)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <span className="truncate">{ex.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected exercise description (scrollable) */}
            <div className="flex-1 overflow-auto p-4">
              {allComplete ? (
                /* ── Capstone complete celebration ── */
                <div className="text-center py-8 space-y-4">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                  <h2 className="text-lg font-bold text-[var(--cta)]">
                    Capstone Complete!
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    You nailed every exercise in{" "}
                    <strong className="text-[var(--foreground)]">
                      {capstone.title}
                    </strong>
                    . Time: {formatElapsed(elapsed)}.
                  </p>
                  {completeError && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/25 rounded-md">
                      <p className="text-xs text-red-400 mb-2">
                        Failed to record completion. Please retry.
                      </p>
                      <button
                        className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors cursor-pointer"
                        onClick={() => setCapstoneComplete(false)}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    className="inline-block mt-2 px-4 py-2 rounded-md bg-[var(--cta)] text-[var(--cta-foreground)] text-sm font-medium hover:brightness-105 transition-all"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <BadgeUI
                      variant="outline"
                      className="text-xs font-mono bg-[var(--accent)]/50"
                    >
                      {selectedExercise.concept}
                    </BadgeUI>
                    <BadgeUI
                      variant="outline"
                      className={`text-xs capitalize ${difficultyClass}`}
                    >
                      {selectedExercise.difficulty}
                    </BadgeUI>
                    <BadgeUI
                      variant="outline"
                      className="text-xs text-[var(--muted-foreground)]"
                    >
                      Capstone
                    </BadgeUI>
                  </div>

                  <h2 className="text-base font-semibold mb-3">
                    {selectedExercise.title}
                  </h2>

                  <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-[var(--background)] [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--border)] [&_code]:text-blue-300 [&_code]:text-xs [&_strong]:text-[var(--foreground)] [&_p]:text-[var(--foreground)]/90 [&_li]:text-[var(--foreground)]/90">
                    <Markdown>{selectedExercise.description}</Markdown>
                  </div>

                  {/* Validation feedback */}
                  {validation.status === "passed" && (
                    <div className="mt-4 p-3 bg-[var(--cta)]/10 border border-[var(--cta)]/25 rounded-md">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-[var(--cta)]" />
                        <p className="text-sm font-semibold text-[var(--cta)]">
                          Correct!
                        </p>
                      </div>
                      {selectedExercise.explanation && (
                        <p className="text-xs text-[var(--cta)]/80 leading-relaxed mt-1.5">
                          {selectedExercise.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {validation.status === "failed" && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-md">
                      <div className="flex items-center gap-1.5 mb-1">
                        <XCircle className="w-4 h-4 text-amber-400" />
                        <p className="text-sm font-semibold text-amber-400">
                          Not quite right
                        </p>
                      </div>
                      {validation.error && (
                        <p className="text-xs text-amber-400/80 mt-1">
                          {validation.error}
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        No hints available in capstone mode. Use your skills!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom action bar */}
            {!allComplete && !isComplete(selectedExercise.id) && (
              <div className="p-4 border-t border-[var(--border)] shrink-0">
                <button
                  className={`w-full h-9 px-4 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta)]/60 disabled:pointer-events-none disabled:opacity-50 ${
                    validation.status === "passed"
                      ? "bg-[var(--accent)] text-[var(--foreground)]"
                      : "bg-[var(--cta)] text-[var(--cta-foreground)] hover:brightness-105 active:brightness-95"
                  }`}
                  onClick={validateAnswer}
                  disabled={
                    validation.status === "checking" ||
                    validation.status === "passed"
                  }
                  aria-live="polite"
                >
                  {validation.status === "checking" ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                      />
                      Checking...
                    </>
                  ) : validation.status === "passed" ? (
                    <>
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      Passed!
                    </>
                  ) : (
                    "Check Answer"
                  )}
                </button>
              </div>
            )}

            {!allComplete && isComplete(selectedExercise.id) && (
              <div className="p-4 border-t border-[var(--border)] shrink-0">
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--cta)]">
                  <CheckCircle className="w-4 h-4" />
                  Exercise completed
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ── Center: SQL editor + results ── */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="h-full flex flex-col">
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={runQuery}
              isRunning={execution.status === "running"}
            />
            <ResultsTable execution={execution} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* ── Right: Schema sidebar ── */}
        <ResizablePanel defaultSize={20} minSize={12}>
          <SchemaSidebar
            exerciseTags={[...selectedExercise.tags]}
            activeTab="schema"
            onTabChange={() => {}}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* XP Toast */}
      {xpToast && (
        <XPToast
          xpEarned={xpToast.xpEarned}
          newBadges={xpToast.newBadges}
          onDismiss={() => setXpToast(null)}
        />
      )}
    </div>
  );
}
