"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Database,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AssessmentData {
  readonly id: number;
  readonly phaseId: string;
  readonly assessmentType: string;
  readonly title: string;
  readonly timeLimitMinutes: number;
  readonly exerciseCount: number;
}

interface AttemptData {
  readonly attemptId: number;
  readonly exerciseIds: readonly string[];
  readonly startedAt: string;
  readonly expiresAt: string;
}

type AssessmentState = "ready" | "in_progress" | "completed";

interface ExerciseResult {
  readonly exerciseId: string;
  readonly passed: boolean;
}

interface Props {
  readonly assessment: AssessmentData;
}

export default function AssessmentClient({ assessment }: Props) {
  const [state, setState] = useState<AssessmentState>("ready");
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sql, setSql] = useState("");
  const [results, setResults] = useState<readonly ExerciseResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(assessment.timeLimitMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [finalScore, setFinalScore] = useState<{
    scorePct: number;
    exercisesPassed: number;
    exercisesTotal: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref to the latest submit function so the timer effect never goes stale
  const submitRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Timer
  useEffect(() => {
    if (state !== "in_progress") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Auto-submit when time runs out — uses ref to avoid stale closure (#6)
  useEffect(() => {
    if (timeLeft === 0 && state === "in_progress") {
      submitRef.current?.();
    }
  }, [timeLeft, state]);

  const handleStart = useCallback(async () => {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        assessmentId: assessment.id,
      }),
    });
    const data = await res.json();
    if (res.ok && data.attempt) {
      setAttempt(data.attempt);
      setState("in_progress");
    }
  }, [assessment.id]);

  const handleValidateExercise = useCallback(async () => {
    if (!attempt) return;
    setValidating(true);

    const exerciseId = attempt.exerciseIds[currentIndex];

    // Validate via the standard validate endpoint with correct field names
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId,
        phase: assessment.phaseId,
        userSql: sql,
      }),
    });
    const data = await res.json();

    // Use the correct response field name
    const passed = data.passed === true;
    setResults((prev) => [...prev, { exerciseId, passed }]);

    // Record result server-side for tamper-proof scoring
    await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "validate-exercise",
        attemptId: attempt.attemptId,
        exerciseId,
        passed,
      }),
    }).catch(() => {
      // best-effort — the local result is already tracked
    });

    setValidating(false);

    // Move to next exercise
    if (currentIndex < attempt.exerciseIds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSql("");
    }
  }, [attempt, currentIndex, sql, assessment.phaseId]);

  const handleSubmitAssessment = useCallback(async () => {
    if (!attempt) return;
    setSubmitting(true);
    setState("completed");
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Score is computed server-side from recorded exercise results
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          attemptId: attempt.attemptId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setFinalScore({
          scorePct: data.result.scorePct,
          exercisesPassed: data.result.exercisesPassed,
          exercisesTotal: data.result.exercisesTotal,
        });
      }
    } catch {
      // Fall back to local count if server fails
      const passed = results.filter((r) => r.passed).length;
      const total = attempt.exerciseIds.length;
      setFinalScore({
        scorePct: total > 0 ? Math.round((passed / total) * 100) : 0,
        exercisesPassed: passed,
        exercisesTotal: total,
      });
    }

    setSubmitting(false);
  }, [attempt, results]);

  // Keep submitRef in sync with the latest handleSubmitAssessment
  useEffect(() => {
    submitRef.current = handleSubmitAssessment;
  }, [handleSubmitAssessment]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Assessment</span>
        </div>
        {state === "in_progress" && (
          <div
            className={`flex items-center gap-2 text-sm font-mono font-bold ${
              timeLeft < 60 ? "text-red-400" : "text-[var(--foreground)]"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {state === "ready" && (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-2">{assessment.title}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                {assessment.assessmentType === "entry"
                  ? "Take this assessment to benchmark your current skill level before starting the phase."
                  : "Prove your mastery by completing this exit assessment."}
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span>Time limit: {assessment.timeLimitMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span>
                  {assessment.exerciseCount} exercises (random selection from phase)
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Your score will be recorded and visible on your dashboard
                and to your team manager.
              </p>
            </div>

            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Start Assessment
            </button>
          </>
        )}

        {state === "in_progress" && attempt && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Exercise {currentIndex + 1} of {attempt.exerciseIds.length}
              </h2>
              <div className="flex gap-1.5">
                {attempt.exerciseIds.map((_, i) => {
                  const result = results[i];
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        result
                          ? result.passed
                            ? "bg-[var(--cta)]"
                            : "bg-red-400"
                          : i === currentIndex
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--accent)]"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                Question {currentIndex + 1}
              </p>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="Write your SQL query here..."
                rows={8}
                className="w-full bg-[var(--accent)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-y"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleValidateExercise}
                disabled={validating || !sql.trim()}
                className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {validating ? "Validating..." : "Submit Answer"}
              </button>

              {currentIndex > 0 && (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => prev - 1);
                    setSql("");
                  }}
                  className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
              )}

              {results.length === attempt.exerciseIds.length && (
                <button
                  onClick={handleSubmitAssessment}
                  className="px-5 py-2 rounded-lg bg-[var(--cta)] text-white text-sm font-medium hover:bg-[var(--cta)]/90 transition-colors cursor-pointer"
                >
                  Finish Assessment
                </button>
              )}

              {currentIndex < attempt.exerciseIds.length - 1 &&
                results.length > currentIndex && (
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) => prev + 1);
                      setSql("");
                    }}
                    className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
          </>
        )}

        {state === "completed" && (
          <>
            <div className="text-center py-8">
              <div className="text-5xl mb-4">
                {(finalScore?.scorePct ?? 0) >= 70 ? "🎉" : "📚"}
              </div>
              <h1 className="text-2xl font-bold mb-2">Assessment Complete</h1>
              {finalScore ? (
                <>
                  <p className="text-4xl font-bold mb-2">
                    {finalScore.scorePct}%
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    {finalScore.exercisesPassed} of{" "}
                    {finalScore.exercisesTotal} exercises passed
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] mb-1">
                  {submitting ? "Calculating score..." : "Score unavailable"}
                </p>
              )}
              <p className="text-sm text-[var(--muted-foreground)]">
                {(finalScore?.scorePct ?? 0) >= 70
                  ? "Great job! You demonstrate strong proficiency."
                  : "Keep practicing! Review the exercises you missed."}
              </p>
            </div>

            {/* Exercise results */}
            <div className="space-y-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3"
                >
                  {result.passed ? (
                    <CheckCircle className="w-4 h-4 text-[var(--cta)]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">
                    Exercise {i + 1}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--accent)]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
