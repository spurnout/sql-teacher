"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, CheckCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface ChallengeData {
  readonly exercise: {
    readonly id: string;
    readonly phase: string;
    readonly title: string;
    readonly difficulty: string;
    readonly mode: string;
  };
  readonly date: string;
  readonly completed: boolean;
}

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenges")
      .then((res) => res.json())
      .then((data) => {
        setChallenge(data.challenge ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading daily challenge...
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  const difficultyColor = {
    beginner: "text-emerald-400",
    intermediate: "text-amber-400",
    advanced: "text-red-400",
  }[challenge.exercise.difficulty] ?? "text-[var(--muted-foreground)]";

  return (
    <div
      className={`border rounded-lg p-5 transition-all ${
        challenge.completed
          ? "bg-[var(--cta)]/5 border-[var(--cta)]/30"
          : "bg-gradient-to-r from-[var(--primary)]/5 to-[var(--cta)]/5 border-[var(--primary)]/30"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {challenge.completed ? (
            <CheckCircle className="w-5 h-5 text-[var(--cta)]" />
          ) : (
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          )}
          <div>
            <h3 className="text-sm font-semibold">
              {challenge.completed
                ? "Daily Challenge Complete!"
                : "Today's Challenge"}
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {new Date(challenge.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {!challenge.completed && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[10px] font-medium text-[var(--primary)]">
            <Zap className="w-3 h-3" />
            +50% XP
          </span>
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium">{challenge.exercise.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-medium capitalize ${difficultyColor}`}>
            {challenge.exercise.difficulty}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {challenge.exercise.phase.replace("phase-", "Phase ")}
          </span>
        </div>
      </div>

      {!challenge.completed && (
        <Link
          href={`/learn/${challenge.exercise.phase}/${challenge.exercise.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
        >
          Start Challenge
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
