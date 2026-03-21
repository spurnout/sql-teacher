"use client";

import Link from "next/link";
import type { Recommendation } from "@/lib/adaptive/types";

const TYPE_CONFIG: Record<
  Recommendation["type"],
  { icon: string; label: string; actionLabel: string; color: string }
> = {
  review: {
    icon: "\uD83D\uDD01",
    label: "Review",
    actionLabel: "Go",
    color: "text-amber-400",
  },
  "prerequisite-gap": {
    icon: "\uD83D\uDCDA",
    label: "Prerequisite",
    actionLabel: "Go",
    color: "text-orange-400",
  },
  skip: {
    icon: "\u23ED\uFE0F",
    label: "Skip",
    actionLabel: "Skip",
    color: "text-blue-400",
  },
  "next-best": {
    icon: "\u2B50",
    label: "Recommended",
    actionLabel: "Start",
    color: "text-emerald-400",
  },
};

interface Props {
  readonly recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: Props) {
  const config = TYPE_CONFIG[recommendation.type];

  // Build the link to the exercise
  const href = `/learn/${recommendation.phase}/${recommendation.exerciseId}`;

  return (
    <div className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 hover:border-[var(--border)]/80 hover:bg-[var(--accent)]/20 transition-all">
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${config.color}`}
            >
              {config.label}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {recommendation.concept}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] truncate">
            {recommendation.reason}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="flex-shrink-0 ml-3 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] transition-colors"
      >
        {config.actionLabel} &rarr;
      </Link>
    </div>
  );
}
