"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { CheckCircle, XCircle, Loader2, BookOpen, FileText, Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HintSystem from "./HintSystem";
import QuizPanel from "./QuizPanel";
import CoursePanel from "./CoursePanel";
import type { ClientExercise, Phase } from "@/lib/exercises/types";

export type ValidationState =
  | { readonly status: "idle" }
  | { readonly status: "checking" }
  | { readonly status: "passed" }
  | { readonly status: "failed"; readonly error?: string };

interface Props {
  readonly exercise: ClientExercise;
  readonly validation: ValidationState;
  readonly onValidate: () => void;
  // Quiz mode
  readonly quizAnsweredId: string | null;
  readonly onQuizAnswer: (optionId: string, isCorrect: boolean) => void;
  // Solution viewing
  readonly failedAttempts: number;
  readonly onViewSolution: () => void;
  readonly onOpenSyntaxRef: () => void;
  readonly solutionSql: string | null;
  readonly isVariationActive: boolean;
  readonly activeDescription: string;
  // Course navigation
  readonly allPhases: readonly Phase[];
  readonly isComplete: (id: string) => boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-[var(--cta)] border-[var(--cta)]/30 bg-[var(--cta)]/10",
  intermediate: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  advanced: "text-red-400 border-red-400/30 bg-red-400/10",
};

const MODE_LABELS: Record<string, string> = {
  "worked-example": "Worked Example",
  scaffolded: "Scaffolded",
  open: "Open",
  quiz: "Quiz",
  debug: "Debug & Fix",
};

type Tab = "exercise" | "course";

export default function ExercisePanel({
  exercise,
  validation,
  onValidate,
  quizAnsweredId,
  onQuizAnswer,
  failedAttempts,
  onViewSolution,
  onOpenSyntaxRef,
  solutionSql,
  isVariationActive,
  activeDescription,
  allPhases,
  isComplete,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("exercise");

  const difficultyClass =
    DIFFICULTY_COLORS[exercise.difficulty] ??
    "text-[var(--muted-foreground)] border-[var(--border)]";

  const isQuiz = exercise.mode === "quiz";
  const isDebug = exercise.mode === "debug";
  const showCheckButton =
    !isQuiz &&
    !exercise.skipValidation &&
    exercise.mode !== "worked-example";

  return (
    <div className="h-full flex flex-col bg-[var(--card)]" id="main-content">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        <button
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "exercise"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => setActiveTab("exercise")}
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          Exercise
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "course"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => setActiveTab("course")}
        >
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          Course
        </button>
      </div>

      {/* Course tab */}
      {activeTab === "course" && (
        <div className="flex-1 overflow-hidden">
          <CoursePanel
            allPhases={allPhases}
            currentExerciseId={exercise.id}
            isComplete={isComplete}
          />
        </div>
      )}

      {/* Exercise tab */}
      {activeTab === "exercise" && (
        <>
          {/* Debug mode banner */}
          {isDebug && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/25 shrink-0 flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <p className="text-xs text-red-400 font-medium">
                Bug Report — this query has a bug. Find and fix it!
              </p>
            </div>
          )}

          {/* Variation banner */}
          {isVariationActive && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/25 shrink-0">
              <p className="text-xs text-amber-400 font-medium">
                Variation unlocked — solve this modified version to complete the exercise
              </p>
            </div>
          )}

          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs font-mono bg-[var(--accent)]/50"
              >
                {exercise.concept}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${difficultyClass}`}
              >
                {exercise.difficulty}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs capitalize text-[var(--muted-foreground)]"
              >
                {MODE_LABELS[exercise.mode] ?? exercise.mode}
              </Badge>
            </div>
            <h1 className="text-base font-semibold leading-tight">
              {exercise.title}
            </h1>
          </div>

          {/* Description — scrollable */}
          <div className="flex-1 overflow-auto p-4">
            <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-[var(--background)] [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--border)] [&_code]:text-blue-300 [&_code]:text-xs [&_strong]:text-[var(--foreground)] [&_p]:text-[var(--foreground)]/90 [&_li]:text-[var(--foreground)]/90">
              <Markdown>{activeDescription}</Markdown>
            </div>

            {/* Quiz options */}
            {isQuiz && exercise.quizOptions && (
              <div className="mt-4">
                <QuizPanel
                  options={exercise.quizOptions}
                  explanation={exercise.explanation}
                  answeredOptionId={quizAnsweredId}
                  onAnswer={onQuizAnswer}
                />
              </div>
            )}

            {/* Solution display */}
            {solutionSql && (
              <div className="mt-4 p-3 bg-[var(--accent)]/30 border border-[var(--border)] rounded-md">
                <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Solution
                </p>
                <pre className="text-xs font-mono text-blue-300 overflow-auto whitespace-pre-wrap leading-relaxed">
                  {solutionSql}
                </pre>
              </div>
            )}

            {/* Validation feedback */}
            {validation.status === "passed" && (
              <div className="mt-4 p-3 bg-[var(--cta)]/10 border border-[var(--cta)]/25 rounded-md">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle
                    className="w-4 h-4 text-[var(--cta)] shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-[var(--cta)]">
                    Correct!
                  </p>
                </div>
                {exercise.explanation && !isQuiz && (
                  <p className="text-xs text-[var(--cta)]/80 leading-relaxed">
                    {exercise.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Bug description — shown after solving debug exercises */}
            {validation.status === "passed" && isDebug && exercise.bugDescription && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bug
                    className="w-4 h-4 text-red-400 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                    Bug Explained
                  </p>
                </div>
                <p className="text-xs text-red-300/80 leading-relaxed">
                  {exercise.bugDescription}
                </p>
              </div>
            )}

            {validation.status === "failed" && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle
                    className="w-4 h-4 text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
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
                  Your results should match the expected output exactly.
                </p>
              </div>
            )}
          </div>

          {/* Bottom: hints + check button (hidden for quiz mode) */}
          {!isQuiz && (
            <div className="p-4 border-t border-[var(--border)] space-y-3 shrink-0">
              {exercise.hints.length > 0 && (
                <HintSystem
                  hints={[...exercise.hints]}
                  failedAttempts={failedAttempts}
                  onViewSolution={showCheckButton ? onViewSolution : undefined}
                  onOpenSyntaxRef={onOpenSyntaxRef}
                />
              )}

              {showCheckButton && (
                <button
                  className={`w-full h-9 px-4 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta)]/60 disabled:pointer-events-none disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
                    validation.status === "passed"
                      ? "bg-[var(--accent)] text-[var(--foreground)]"
                      : "bg-[var(--cta)] text-[var(--cta-foreground)] hover:brightness-105 active:brightness-95"
                  }`}
                  onClick={onValidate}
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
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
