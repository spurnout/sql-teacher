"use client";

import { useEffect, useState } from "react";
import type { BadgeId } from "@/lib/exercises/types";
import { getBadge } from "@/lib/gamification/badges";

interface Props {
  readonly xpEarned: number;
  readonly newBadges: readonly BadgeId[];
  readonly onDismiss: () => void;
}

export default function XPToast({ xpEarned, newBadges, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 50);

    // Auto-dismiss after 3.5 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  if (xpEarned === 0 && newBadges.length === 0) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-4 min-w-[200px]">
        {xpEarned > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-bold text-[var(--cta)]">
              +{xpEarned} XP
            </span>
          </div>
        )}
        {newBadges.map((badgeId) => {
          const badge = getBadge(badgeId);
          if (!badge) return null;
          return (
            <div key={badgeId} className="flex items-center gap-2 mt-1">
              <span className="text-lg">{badge.icon}</span>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Badge Earned!
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {badge.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
