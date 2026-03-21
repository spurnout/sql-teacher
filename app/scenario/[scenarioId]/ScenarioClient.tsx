"use client";

import { useState, useCallback, useEffect } from "react";
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
import HintSystem from "@/components/exercise/HintSystem";
import { useGamification } from "@/lib/gamification/useGamification";
import XPToast from "@/components/ui/XPToast";
import type { BadgeId, Hint } from "@/lib/exercises/types";
import type { ClientScenario, ScenarioProgress } from "@/lib/scenarios/types";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  readonly scenario: ClientScenario;
  readonly username: string;
  readonly initialProgress: ScenarioProgress | null;
}

type ValidationStatus = "idle" | "checking" | "passed" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-[var(--cta)] border-[var(--cta)]/30 bg-[var(--cta)]/10",
  intermediate: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  advanced: "text-red-400 border-red-400/30 bg-red-400/10",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScenarioClient({
  scenario,
  username,
  initialProgress,
}: Props) {
  // ---- derive initial state from progress ----
  const initialCompleted = new Set(initialProgress?.stepsCompleted ?? []);
  const initialStep = Math.min(
    initialProgress?.currentStep ?? 0,
    scenario.steps.length - 1
  );

  // ---- state ----
  const [selectedIndex, setSelectedIndex] = useState(initialStep);
  const [sql, setSql] = useState("");
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });
  const [validation, setValidation] = useState<{
    status: ValidationStatus;
    error?: string;
  }>({ status: "idle" });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(initialCompleted);
  const [scenarioComplete, setScenarioComplete] = useState(
    initialProgress?.completedAt !== null && initialProgress?.completedAt !== undefined
  );
  const [narrativeOpen, setNarrativeOpen] = useState(
    initialCompleted.size === 0
  );
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [xpToast, setXpToast] = useState<{
    xpEarned: number;
    newBadges: BadgeId[];
  } | null>(null);

  // ---- hooks ----
  const gamification = useGamification();

  // ---- derived ----
  const selectedStep = scenario.steps[selectedIndex];
  const completedCount = completedSteps.size;
  const totalSteps = scenario.steps.length;
  const allComplete = completedCount === totalSteps;

  // Which steps are unlocked? Step 0 is always unlocked. Step N is unlocked
  // when step N-1 is completed.
  const isStepUnlocked = useCallback(
    (stepIndex: number) => {
      if (stepIndex === 0) return true;
      return completedSteps.has(stepIndex - 1);
    },
    [completedSteps]
  );

  // ---- reset editor on step switch ----
  useEffect(() => {
    setSql(selectedStep?.starterSql ?? "");
    setExecution({ status: "idle" });
    setValidation({ status: "idle" });
    setFailedAttempts(0);
    setXpToast(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  // ---- handlers ----
  const selectStep = useCallback(
    (index: number) => {
      if (isStepUnlocked(index)) {
        setSelectedIndex(index);
      }
    },
    [isStepUnlocked]
  );

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
    if (!selectedStep) return;
    setValidation({ status: "checking" });
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepIndex: selectedStep.stepIndex,
          userSql: sql,
        }),
      });
      const data = await res.json();
      if (data.passed) {
        setValidation({ status: "passed" });
        setCompletedSteps((prev) => {
          const next = new Set(prev);
          next.add(selectedStep.stepIndex);
          return next;
        });

        // Show XP toast
        const earnedBadges: BadgeId[] = data.newBadges ?? [];
        if (data.xpAwarded > 0 || earnedBadges.length > 0) {
          setXpToast({
            xpEarned: data.xpAwarded,
            newBadges: earnedBadges,
          });
          // Update gamification display
          gamification.applyXPEvent({
            xpEarned: data.xpAwarded,
            newBadges: earnedBadges,
            streak: gamification.streak.current,
          });
        }

        if (data.scenarioCompleted) {
          setScenarioComplete(true);
        }
      } else {
        setValidation({ status: "failed", error: data.error });
        setFailedAttempts((prev) => prev + 1);
      }
    } catch {
      setValidation({ status: "failed", error: "Network error" });
      setFailedAttempts((prev) => prev + 1);
    }
  }, [sql, selectedStep, scenario.id, gamification]);

  const advanceToNextStep = useCallback(() => {
    if (selectedIndex < totalSteps - 1) {
      setSelectedIndex(selectedIndex + 1);
      setNarrativeOpen(false);
    }
  }, [selectedIndex, totalSteps]);

  if (!selectedStep) return null;

  const stepDifficultyClass =
    DIFFICULTY_COLORS[selectedStep.difficulty] ??
    "text-[var(--muted-foreground)] border-[var(--border)]";

  const isCurrentStepComplete = completedSteps.has(selectedStep.stepIndex);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* -- Nav bar -- */}
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
          <BookOpen
            className="w-3.5 h-3.5 text-[var(--cta)]"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold">{scenario.title}</span>
        </div>

        <div className="flex items-center gap-4">
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

      {/* -- Main content -- */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* -- Left: step selector + description -- */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="h-full flex flex-col bg-[var(--card)]">
            {/* Progress bar */}
            <div className="p-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                  Scenario Progress
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {completedCount}/{totalSteps}
                </p>
              </div>
              <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[var(--cta)] rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Narrative intro (collapsible) */}
            <div className="border-b border-[var(--border)] shrink-0">
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                onClick={() => setNarrativeOpen((prev) => !prev)}
              >
                {narrativeOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                )}
                Scenario Brief
              </button>
              {narrativeOpen && (
                <div className="px-4 pb-3">
                  <div className="prose prose-sm prose-invert max-w-none [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:text-xs [&_p]:text-[var(--foreground)]/80 [&_p]:leading-relaxed [&_strong]:text-[var(--foreground)]">
                    <Markdown>{scenario.narrative}</Markdown>
                  </div>
                </div>
              )}
            </div>

            {/* Step list */}
            <div className="p-2 border-b border-[var(--border)] shrink-0 space-y-0.5">
              {scenario.steps.map((step, i) => {
                const done = completedSteps.has(step.stepIndex);
                const unlocked = isStepUnlocked(step.stepIndex);
                const active = i === selectedIndex;
                return (
                  <button
                    key={step.stepIndex}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-xs transition-colors ${
                      !unlocked
                        ? "opacity-40 cursor-not-allowed"
                        : active
                          ? "bg-[var(--primary)]/15 text-[var(--foreground)] cursor-pointer"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/30 cursor-pointer"
                    }`}
                    onClick={() => selectStep(step.stepIndex)}
                    disabled={!unlocked}
                  >
                    <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-[var(--cta)]" />
                      ) : !unlocked ? (
                        <Lock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
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
                    <span className="truncate">{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected step description (scrollable) */}
            <div className="flex-1 overflow-auto p-4">
              {allComplete && scenarioComplete ? (
                /* -- Scenario complete celebration -- */
                <div className="text-center py-8 space-y-4">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                  <h2 className="text-lg font-bold text-[var(--cta)]">
                    Scenario Complete!
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    You completed all {totalSteps} steps of{" "}
                    <strong className="text-[var(--foreground)]">
                      {scenario.title}
                    </strong>
                    .
                  </p>
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
                      Step {selectedStep.stepIndex + 1}/{totalSteps}
                    </BadgeUI>
                    <BadgeUI
                      variant="outline"
                      className={`text-xs capitalize ${stepDifficultyClass}`}
                    >
                      {selectedStep.difficulty}
                    </BadgeUI>
                    {selectedStep.tags.slice(0, 3).map((tag) => (
                      <BadgeUI
                        key={tag}
                        variant="outline"
                        className="text-xs text-[var(--muted-foreground)]"
                      >
                        {tag}
                      </BadgeUI>
                    ))}
                  </div>

                  <h2 className="text-base font-semibold mb-3">
                    {selectedStep.title}
                  </h2>

                  {/* Context from previous step */}
                  {selectedStep.contextFromPreviousStep && (
                    <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-xs text-blue-300 leading-relaxed">
                        {selectedStep.contextFromPreviousStep}
                      </p>
                    </div>
                  )}

                  <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-[var(--background)] [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--border)] [&_code]:text-blue-300 [&_code]:text-xs [&_strong]:text-[var(--foreground)] [&_p]:text-[var(--foreground)]/90 [&_li]:text-[var(--foreground)]/90 [&_em]:text-[var(--muted-foreground)]">
                    <Markdown>{selectedStep.description}</Markdown>
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
                      {selectedStep.explanation && (
                        <p className="text-xs text-[var(--cta)]/80 leading-relaxed mt-1.5">
                          {selectedStep.explanation}
                        </p>
                      )}
                      {/* Advance button */}
                      {selectedIndex < totalSteps - 1 && (
                        <button
                          className="mt-2 px-3 py-1.5 rounded-md bg-[var(--cta)] text-[var(--cta-foreground)] text-xs font-medium hover:brightness-105 transition-all cursor-pointer"
                          onClick={advanceToNextStep}
                        >
                          Continue to Step {selectedIndex + 2} →
                        </button>
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
                    </div>
                  )}

                  {/* Hints (only when not yet passed) */}
                  {!isCurrentStepComplete && selectedStep.hints.length > 0 && (
                    <div className="mt-4">
                      <HintSystem
                        hints={[...selectedStep.hints] as Hint[]}
                        failedAttempts={failedAttempts}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom action bar */}
            {!allComplete && !isCurrentStepComplete && (
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

            {!allComplete && isCurrentStepComplete && (
              <div className="p-4 border-t border-[var(--border)] shrink-0">
                {selectedIndex < totalSteps - 1 ? (
                  <button
                    className="w-full h-9 px-4 rounded-md text-sm font-medium bg-[var(--cta)] text-[var(--cta-foreground)] hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
                    onClick={advanceToNextStep}
                  >
                    Continue to Step {selectedIndex + 2} →
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-[var(--cta)]">
                    <CheckCircle className="w-4 h-4" />
                    Step completed
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* -- Center: SQL editor + results -- */}
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

        {/* -- Right: Schema sidebar -- */}
        <ResizablePanel defaultSize={20} minSize={12}>
          <SchemaSidebar
            exerciseTags={[...selectedStep.tags]}
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
