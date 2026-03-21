"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, CheckCircle, Eye, HelpCircle, Lock, Trophy, Award, Shield, Sun, Moon, Settings, Search, Users } from "lucide-react";
import { useColorMode } from "@/components/ThemeProvider";
import type { Level } from "@/lib/exercises/types";
import PathProgress from "@/components/dashboard/PathProgress";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import LearnerAnalytics from "./LearnerAnalytics";
import RecommendationsPanel from "./RecommendationsPanel";
import SearchModal from "@/components/SearchModal";
import ChallengeModesSection from "@/components/dashboard/ChallengeModes";
import ScenariosSection from "@/components/dashboard/ScenariosSection";

/** Sanitized phase data — no expectedSql, hints, explanation, or variation */
interface DashboardPhase {
  readonly id: string;
  readonly title: string;
  readonly exercises: readonly {
    readonly id: string;
    readonly title: string;
    readonly concept: string;
    readonly phase: string;
    readonly mode: string;
  }[];
}
import { ALL_BADGES } from "@/lib/gamification/badges";

interface CapstoneStatus {
  readonly id: string;
  readonly title: string;
  readonly exerciseCount: number;
  readonly exercisesComplete: number;
  readonly phasesComplete: boolean;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

interface PathPhaseData {
  readonly phaseId: string;
  readonly phaseOrder: number;
  readonly milestoneLabel: string | null;
}

interface PathProgressItem {
  readonly path: {
    readonly id: number;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly estimatedHours: number;
    readonly targetRole: string;
    readonly phases: readonly PathPhaseData[];
  };
  readonly enrollment: {
    readonly pathId: number;
    readonly startedAt: string;
    readonly completedAt: string | null;
  } | null;
  readonly phasesCompleted: number;
  readonly totalPhases: number;
  readonly exercisesCompleted: number;
  readonly totalExercises: number;
  readonly currentMilestone: string | null;
  readonly nextMilestone: string | null;
}

interface Props {
  readonly username: string;
  readonly isAdmin?: boolean;
  readonly allPhases: readonly DashboardPhase[];
  readonly completed: Record<string, { completedAt: string }>;
  readonly solutionViews: Record<string, { viewedAt: string }>;
  readonly totalXP: number;
  readonly level: Level;
  readonly levelProgress: {
    readonly progress: number;
    readonly nextLevel: Level | null;
    readonly nextThreshold: number | null;
  };
  readonly streak: { readonly current: number; readonly longest: number };
  readonly badges: readonly { readonly badgeId: string; readonly earnedAt: string }[];
  readonly capstones: readonly CapstoneStatus[];
  readonly learningPaths: readonly PathProgressItem[];
}

export default function DashboardClient({
  username,
  isAdmin = false,
  allPhases,
  completed,
  solutionViews,
  totalXP,
  level,
  levelProgress,
  streak,
  badges,
  capstones,
  learningPaths,
}: Props) {
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();
  const [claimingCert, setClaimingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchExercises = useMemo(
    () =>
      allPhases.flatMap((p) =>
        p.exercises.map((e) => ({
          id: e.id,
          title: e.title,
          concept: e.concept,
          phase: e.phase,
          phaseTitle: p.title,
        }))
      ),
    [allPhases]
  );

  // Ctrl+K / Cmd+K opens search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allExercises = useMemo(
    () => allPhases.flatMap((p) => p.exercises),
    [allPhases]
  );
  const totalExercises = allExercises.length;
  const totalCompleted = Object.keys(completed).length;
  const totalPct = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;

  const quizExercises = allExercises.filter((e) => e.mode === "quiz");
  const quizPassed = quizExercises.filter((e) => completed[e.id]).length;
  const allCapstonesComplete = capstones.every((c) => !!c.completedAt);

  const handleClaimCertificate = useCallback(async () => {
    setClaimingCert(true);
    setCertError(null);
    try {
      const res = await fetch("/api/certificate", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        router.push(data.url);
      } else {
        setCertError(data.error ?? "Failed to generate certificate. Please try again.");
        setClaimingCert(false);
      }
    } catch {
      setCertError("Network error. Please try again.");
      setClaimingCert(false);
    }
  }, [router]);

  const solutionViewList = allExercises.filter((e) => solutionViews[e.id]);
  const earnedBadgeIds = new Set(badges.map((b) => b.badgeId));

  const firstExercise = allPhases[0]?.exercises[0];
  const backHref = firstExercise
    ? `/learn/${firstExercise.phase}/${firstExercise.id}`
    : "/";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors mr-1"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              Admin
            </Link>
          )}
          <Link
            href="/team"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mr-1"
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            Team
          </Link>
          <button
            type="button"
            onClick={toggleColorMode}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
            aria-label={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {colorMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
            aria-label="Search exercises (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>
          <Link
            href="/help"
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            aria-label="Help & FAQ"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
          <Link
            href="/settings"
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <span className="text-sm text-[var(--muted-foreground)] ml-1">{username}</span>
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ml-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to exercises
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Your Progress</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track your SQL learning journey
          </p>
        </div>

        {/* Level + XP + Streak row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Level & XP */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                Level
              </p>
            </div>
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-xs text-amber-400 font-medium mt-1">
              {totalXP} XP
            </p>
            {levelProgress.nextLevel && levelProgress.nextThreshold && (
              <>
                <div className="mt-2 h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
                  <div
                    className="h-1.5 bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress.progress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  {levelProgress.nextThreshold - totalXP} XP to {levelProgress.nextLevel}
                </p>
              </>
            )}
          </div>

          {/* Streak */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔥</span>
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                Streak
              </p>
            </div>
            <p className="text-2xl font-bold">
              {streak.current}
              <span className="text-sm font-normal text-[var(--muted-foreground)] ml-1">
                days
              </span>
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              Best: {streak.longest} days
            </p>
          </div>

          {/* Completed count */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                Completed
              </p>
            </div>
            <p className="text-2xl font-bold">
              {totalCompleted}
              <span className="text-sm font-normal text-[var(--muted-foreground)] ml-1">
                / {totalExercises}
              </span>
            </p>
            <div className="mt-2 h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-[var(--cta)] rounded-full transition-all duration-500"
                style={{ width: `${totalPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-base font-semibold mb-4">Badges</h2>
          <div className="grid grid-cols-5 gap-3">
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`bg-[var(--card)] border rounded-lg p-3 text-center transition-all ${
                    earned
                      ? "border-[var(--cta)] bg-[var(--cta)]/5"
                      : "border-[var(--border)] opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {earned ? badge.icon : <Lock className="w-5 h-5 mx-auto text-[var(--muted-foreground)]" />}
                  </div>
                  <p className="text-[10px] font-medium leading-tight">
                    {badge.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                Quizzes Passed
              </p>
            </div>
            <p className="text-2xl font-bold">
              {quizPassed}
              <span className="text-sm font-normal text-[var(--muted-foreground)] ml-1">
                / {quizExercises.length}
              </span>
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                Solutions Viewed
              </p>
            </div>
            <p className="text-2xl font-bold">{solutionViewList.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">
              {solutionViewList.length === 0
                ? "Great — none yet!"
                : "Exercises where you peeked"}
            </p>
          </div>
        </div>

        {/* Daily Challenge */}
        <DailyChallenge />

        {/* Challenge Modes */}
        <ChallengeModesSection />

        {/* Multi-Step Scenarios */}
        <ScenariosSection />

        {/* Adaptive Learning Recommendations */}
        <RecommendationsPanel />

        {/* Learning Paths */}
        <PathProgress paths={learningPaths} />

        {/* Per-phase progress */}
        <div>
          <h2 className="text-base font-semibold mb-4">Phase Breakdown</h2>
          <div className="space-y-4">
            {allPhases.map((phase) => {
              const total = phase.exercises.length;
              const done = phase.exercises.filter((e) => completed[e.id]).length;
              const pct = total > 0 ? (done / total) * 100 : 0;

              return (
                <div key={phase.id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{phase.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {done}/{total}
                    </p>
                  </div>
                  <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "var(--cta)" : "var(--primary)",
                      }}
                    />
                  </div>
                  {pct === 100 && (
                    <p className="text-xs text-[var(--cta)] mt-1.5 font-medium">
                      ✓ Complete!
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Capstone Projects */}
        <div>
          <h2 className="text-base font-semibold mb-4">Capstone Projects</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Complete all 9 phases to unlock capstone projects. Pass all 4 to earn your certificate.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {capstones.map((cap) => {
              const isLocked = !cap.phasesComplete;
              const isComplete = !!cap.completedAt;
              const isStarted = !!cap.startedAt;
              const pct =
                cap.exerciseCount > 0
                  ? (cap.exercisesComplete / cap.exerciseCount) * 100
                  : 0;

              return (
                <div
                  key={cap.id}
                  className={`bg-[var(--card)] border rounded-lg p-4 transition-all ${
                    isComplete
                      ? "border-[var(--cta)] bg-[var(--cta)]/5"
                      : isLocked
                        ? "border-[var(--border)] opacity-50"
                        : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isComplete ? (
                      <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                    ) : (
                      <Database className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
                    )}
                    <p className="text-sm font-medium">{cap.title}</p>
                  </div>

                  {!isLocked && (
                    <>
                      <div className="h-1.5 bg-[var(--accent)] rounded-full overflow-hidden mb-2">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              isComplete ? "var(--cta)" : "var(--primary)",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {cap.exercisesComplete}/{cap.exerciseCount} exercises
                        </p>
                        {isComplete ? (
                          <span className="flex items-center gap-1 text-xs text-[var(--cta)] font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Complete
                          </span>
                        ) : (
                          <Link
                            href={`/capstone/${cap.id}`}
                            className="text-xs text-[var(--primary)] hover:text-[var(--foreground)] font-medium transition-colors"
                          >
                            {isStarted ? "Resume" : "Start"} →
                          </Link>
                        )}
                      </div>
                    </>
                  )}

                  {isLocked && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Complete all phases to unlock
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Certificate claim button */}
          {allCapstonesComplete && (
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/25 rounded-lg text-center">
              <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                All capstones complete!
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                You&apos;ve earned your SQL Proficiency Certificate.
              </p>
              {certError && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-3">
                  {certError}
                </p>
              )}
              <button
                onClick={handleClaimCertificate}
                disabled={claimingCert}
                className="px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {claimingCert ? "Generating..." : "Claim Certificate"}
              </button>
            </div>
          )}
        </div>

        {/* Solutions viewed */}
        {solutionViewList.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4">Solutions You Viewed</h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              These exercises had their solution revealed. The app modified them slightly so you still had to learn the concept.
            </p>
            <div className="space-y-2">
              {solutionViewList.map((ex) => {
                const view = solutionViews[ex.id];
                const isNowComplete = !!completed[ex.id];
                return (
                  <Link
                    key={ex.id}
                    href={`/learn/${ex.phase}/${ex.id}`}
                    className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 hover:border-[var(--border)]/80 hover:bg-[var(--accent)]/20 transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium">{ex.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ex.phase.replace("-", " ")} · viewed{" "}
                        {new Date(view.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNowComplete ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--cta)]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400">
                          Retry →
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Section */}
        <LearnerAnalytics />
      </main>

      {/* Search Modal */}
      <SearchModal
        exercises={searchExercises}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
