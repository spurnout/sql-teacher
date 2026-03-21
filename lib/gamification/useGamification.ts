"use client";

import { useState, useEffect, useCallback } from "react";
import type { Level, BadgeId } from "@/lib/exercises/types";

interface LevelProgress {
  readonly currentLevel: Level;
  readonly nextLevel: Level | null;
  readonly progress: number; // 0-1
  readonly nextThreshold: number | null;
}

interface StreakData {
  readonly current: number;
  readonly longest: number;
  readonly lastDate: string | null;
}

interface BadgeData {
  readonly badgeId: string;
  readonly earnedAt: string;
}

interface GamificationData {
  readonly totalXP: number;
  readonly level: Level;
  readonly levelProgress: LevelProgress;
  readonly streak: StreakData;
  readonly badges: readonly BadgeData[];
}

export interface XPEarnedEvent {
  readonly xpEarned: number;
  readonly newBadges: readonly BadgeId[];
  readonly streak: number;
}

export function useGamification() {
  const [data, setData] = useState<GamificationData>({
    totalXP: 0,
    level: "Novice",
    levelProgress: {
      currentLevel: "Novice",
      nextLevel: "Apprentice",
      progress: 0,
      nextThreshold: 100,
    },
    streak: { current: 0, longest: 0, lastDate: null },
    badges: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/api/gamification")
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLoadError(false);
        setLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setLoaded(true);
      });
  }, []);

  /** Optimistically update after XP is earned (call after progress POST response) */
  const applyXPEvent = useCallback((event: XPEarnedEvent) => {
    setData((prev) => {
      const newTotalXP = prev.totalXP + event.xpEarned;
      const newBadges = event.newBadges.map((badgeId) => ({
        badgeId,
        earnedAt: new Date().toISOString(),
      }));
      return {
        ...prev,
        totalXP: newTotalXP,
        streak: {
          ...prev.streak,
          current: event.streak,
          longest: Math.max(prev.streak.longest, event.streak),
        },
        badges: [...newBadges, ...prev.badges],
      };
    });
  }, []);

  return {
    ...data,
    loaded,
    loadError,
    applyXPEvent,
  };
}
