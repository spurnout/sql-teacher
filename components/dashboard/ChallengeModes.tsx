"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Timer, Target, Shuffle, Loader2 } from "lucide-react";

export default function ChallengeModes() {
  const router = useRouter();
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);

  const handleRandomPractice = useCallback(async () => {
    setRandomLoading(true);
    setRandomError(null);
    try {
      const res = await fetch("/api/challenges/random");
      const data = await res.json();
      if (res.ok && data.exerciseId && data.phaseId) {
        router.push(`/learn/${data.phaseId}/${data.exerciseId}`);
      } else {
        setRandomError(data.error ?? "No exercises available.");
        setRandomLoading(false);
      }
    } catch {
      setRandomError("Network error. Please try again.");
      setRandomLoading(false);
    }
  }, [router]);

  return (
    <div>
      <h2 className="text-base font-semibold mb-4">Challenge Modes</h2>
      <div className="grid grid-cols-3 gap-4">
        {/* Speed Run */}
        <Link
          href="/challenges/speed-run"
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--cta)]/30 hover:bg-[var(--cta)]/5 transition-all group"
        >
          <Timer className="w-5 h-5 text-[var(--cta)] mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium mb-1">Speed Run</p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            5 exercises, 10 minutes. Beat your best time.
          </p>
        </Link>

        {/* SQL Golf */}
        <Link
          href="/challenges/golf"
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all group"
        >
          <Target className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-medium mb-1">SQL Golf</p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Solve with fewest characters. Concise SQL wins.
          </p>
        </Link>

        {/* Random Practice */}
        <button
          type="button"
          onClick={handleRandomPractice}
          disabled={randomLoading}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all group text-left cursor-pointer disabled:opacity-50"
        >
          {randomLoading ? (
            <Loader2 className="w-5 h-5 text-emerald-400 mb-2 animate-spin" />
          ) : (
            <Shuffle className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          )}
          <p className="text-sm font-medium mb-1">
            {randomLoading ? "Finding..." : "Random Practice"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            {randomError ?? "Jump to a random exercise targeting your weak spots."}
          </p>
        </button>
      </div>
    </div>
  );
}
