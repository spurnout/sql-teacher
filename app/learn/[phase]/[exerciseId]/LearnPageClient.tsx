"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ExercisePanel from "@/components/exercise/ExercisePanel";
import type { ValidationState } from "@/components/exercise/ExercisePanel";
import SqlEditor from "@/components/editor/SqlEditor";
import ResultsTable from "@/components/editor/ResultsTable";
import type { ExecutionState } from "@/components/editor/ResultsTable";
import SchemaSidebar from "@/components/layout/SchemaSidebar";
import ExerciseNav from "@/components/exercise/ExerciseNav";
import type { ClientExercise, ClientExerciseVariation, Phase, BadgeId } from "@/lib/exercises/types";
import type { SchemaReference } from "@/content/schema/reference";
import { useProgress } from "@/lib/progress/storage";
import { useGamification } from "@/lib/gamification/useGamification";
import type { XPEarnedEvent } from "@/lib/gamification/useGamification";
import XPToast from "@/components/ui/XPToast";

interface Props {
  readonly exercise: ClientExercise;
  readonly allPhases: readonly Phase[];
  readonly username: string;
  readonly schemaReference?: SchemaReference;
}

export default function LearnPageClient({ exercise, allPhases, username, schemaReference }: Props) {
  const [sql, setSql] = useState(exercise.starterSql ?? "");
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const { markComplete, isComplete, completedCount } = useProgress();
  const gamification = useGamification();

  // XP toast state
  const [xpToast, setXpToast] = useState<{ xpEarned: number; newBadges: BadgeId[] } | null>(null);

  // Solution + variation state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [solutionSql, setSolutionSql] = useState<string | null>(null);
  const [isVariationActive, setIsVariationActive] = useState(false);
  const [useVariation, setUseVariation] = useState(false);
  const [variationData, setVariationData] = useState<ClientExerciseVariation | null>(null);

  // Quiz state
  const [quizAnsweredId, setQuizAnsweredId] = useState<string | null>(null);

  // Right sidebar tab state (controlled from hint system)
  const [rightSidebarTab, setRightSidebarTab] = useState<"schema" | "docs">("schema");

  // Reset all exercise-specific state when navigating to a new exercise
  useEffect(() => {
    setSql(exercise.starterSql ?? "");
    setExecution({ status: "idle" });
    setValidation({ status: "idle" });
    setFailedAttempts(0);
    setSolutionSql(null);
    setIsVariationActive(false);
    setUseVariation(false);
    setVariationData(null);
    setQuizAnsweredId(null);
  }, [exercise.id, exercise.starterSql]);

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
    setValidation({ status: "checking" });
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          phase: exercise.phase,
          userSql: sql,
          useVariation,
        }),
      });
      const data = await res.json();
      if (data.passed) {
        setValidation({ status: "passed" });
        const result = await markComplete(exercise.id);
        if (result && result.xpEarned > 0) {
          gamification.applyXPEvent(result);
          setXpToast({ xpEarned: result.xpEarned, newBadges: result.newBadges as BadgeId[] });
        }
      } else {
        setFailedAttempts((prev) => prev + 1);
        setValidation({
          status: "failed",
          error: data.error,
        });
      }
    } catch {
      setFailedAttempts((prev) => prev + 1);
      setValidation({ status: "failed", error: "Network error" });
    }
  }, [sql, exercise.id, exercise.phase, useVariation, markComplete, gamification]);

  const handleViewSolution = useCallback(async () => {
    try {
      const res = await fetch("/api/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, phase: exercise.phase }),
      });
      const data = await res.json();
      if (!res.ok) return;

      setSolutionSql(data.solutionSql);

      if (data.variation) {
        setVariationData(data.variation as ClientExerciseVariation);
        setIsVariationActive(true);
        setUseVariation(true);
        setValidation({ status: "idle" });
        // Load variation's starter SQL into editor if provided
        if (data.variation.starterSql) {
          setSql(data.variation.starterSql);
        }
      }
    } catch {
      // Silent — solution viewing is best-effort
    }
  }, [exercise.id, exercise.phase]);

  const handleQuizAnswer = useCallback(
    async (optionId: string, correct: boolean) => {
      setQuizAnsweredId(optionId);
      if (correct) {
        setValidation({ status: "passed" });
        const result = await markComplete(exercise.id);
        if (result && result.xpEarned > 0) {
          gamification.applyXPEvent(result);
          setXpToast({ xpEarned: result.xpEarned, newBadges: result.newBadges as BadgeId[] });
        }
      }
    },
    [exercise.id, markComplete, gamification]
  );

  const activeDescription =
    isVariationActive && variationData
      ? variationData.description
      : exercise.description;

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <ExerciseNav
        exercise={exercise}
        allPhases={allPhases}
        username={username}
        totalXP={gamification.totalXP}
        currentStreak={gamification.streak.current}
        isComplete={isComplete}
        completedCount={completedCount}
      />

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Left: Exercise + Course nav */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <ExercisePanel
            exercise={exercise}
            validation={validation}
            onValidate={validateAnswer}
            quizAnsweredId={quizAnsweredId}
            onQuizAnswer={handleQuizAnswer}
            failedAttempts={failedAttempts}
            onViewSolution={handleViewSolution}
            onOpenSyntaxRef={() => setRightSidebarTab("docs")}
            solutionSql={solutionSql}
            isVariationActive={isVariationActive}
            activeDescription={activeDescription}
            allPhases={allPhases}
            isComplete={isComplete}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: Editor + Results */}
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

        {/* Right: Schema + SQL Docs */}
        <ResizablePanel defaultSize={20} minSize={12}>
          <SchemaSidebar
            exerciseTags={exercise.tags}
            activeTab={rightSidebarTab}
            onTabChange={setRightSidebarTab}
            schemaReference={schemaReference}
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
