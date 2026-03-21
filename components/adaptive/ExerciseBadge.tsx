"use client";

import type { RecommendationType } from "@/lib/adaptive/types";

const BADGE_CONFIG: Record<
  RecommendationType,
  { label: string; icon: string; className: string }
> = {
  review: {
    label: "Review",
    icon: "\uD83D\uDD01",
    className:
      "bg-amber-400/10 text-amber-400 border-amber-400/20",
  },
  "prerequisite-gap": {
    label: "Prereq",
    icon: "\uD83D\uDCDA",
    className:
      "bg-orange-400/10 text-orange-400 border-orange-400/20",
  },
  skip: {
    label: "Skip",
    icon: "\u23ED\uFE0F",
    className:
      "bg-blue-400/10 text-blue-400 border-blue-400/20",
  },
  "next-best": {
    label: "Next",
    icon: "\u2B50",
    className:
      "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  },
};

interface Props {
  readonly type: RecommendationType;
}

export default function ExerciseBadge({ type }: Props) {
  const config = BADGE_CONFIG[type];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
