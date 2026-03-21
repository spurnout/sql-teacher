"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { Hint } from "@/lib/exercises/types";

const HINT_LABELS: Record<number, string> = {
  1: "Conceptual Hint",
  2: "Structural Hint",
  3: "Near-Answer Hint",
};

interface Props {
  readonly hints: Hint[];
  readonly failedAttempts?: number;
  readonly onViewSolution?: () => void;
  readonly onOpenSyntaxRef?: () => void;
}

export default function HintSystem({
  hints,
  failedAttempts = 0,
  onViewSolution,
  onOpenSyntaxRef,
}: Props) {
  const [revealedCount, setRevealedCount] = useState(0);

  const sortedHints = [...hints].sort((a, b) => a.level - b.level);
  const revealedHints = sortedHints.slice(0, revealedCount);
  const hasMoreHints = revealedCount < hints.length;
  const allHintsShown = hints.length > 0 && revealedCount >= hints.length;
  const showSolutionButton =
    onViewSolution && (allHintsShown || failedAttempts >= 3);

  return (
    <div className="space-y-2">
      {revealedHints.map((hint) => (
        <div
          key={hint.level}
          className="p-2.5 bg-[var(--muted)]/50 rounded-md border border-[var(--border)]/50"
        >
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {HINT_LABELS[hint.level] ?? `Hint ${hint.level}`}
          </p>
          <p className="text-xs text-[var(--foreground)]">{hint.text}</p>
        </div>
      ))}

      {hasMoreHints && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setRevealedCount((prev) => prev + 1)}
        >
          {revealedCount === 0 ? "Show hint" : "Show another hint"}
          {revealedCount > 0 && (
            <span className="ml-1 text-[var(--muted-foreground)]">
              ({hints.length - revealedCount} remaining)
            </span>
          )}
        </Button>
      )}

      {/* Syntax reference link — appears after first hint is revealed */}
      {revealedCount > 0 && onOpenSyntaxRef && (
        <button
          className="text-xs text-[var(--primary)] hover:underline underline-offset-2 block"
          onClick={onOpenSyntaxRef}
        >
          View syntax reference →
        </button>
      )}

      {/* View Solution button — appears after all hints shown OR after 3 failed attempts */}
      {showSolutionButton && (
        <button
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[var(--muted-foreground)] border border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/50 transition-colors"
          onClick={onViewSolution}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          View Solution
        </button>
      )}
    </div>
  );
}
