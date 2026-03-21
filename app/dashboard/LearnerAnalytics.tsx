"use client";

import { useState, useEffect, useCallback } from "react";
import AnalyticsSection from "@/components/analytics/AnalyticsSection";
import ChartContainer from "@/components/analytics/ChartContainer";
import XPOverTimeChart from "@/components/analytics/XPOverTimeChart";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import ConceptMasteryChart from "@/components/analytics/ConceptMasteryChart";
import AssessmentScoresChart from "@/components/analytics/AssessmentScoresChart";
import type {
  XPOverTimeResponse,
  ActivityHeatmapResponse,
  ConceptMasteryResponse,
  AssessmentScoresResponse,
} from "@/lib/analytics/types";

interface FetchState<T> {
  readonly loading: boolean;
  readonly error: string | null;
  readonly data: T | null;
}

function useAnalyticsFetch<T>(url: string, isOpen: boolean): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const fetchData = useCallback(async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setState({ loading: false, error: "Failed to load data", data: null });
        return;
      }
      const json = await res.json();
      setState({ loading: false, error: null, data: json as T });
    } catch {
      setState({ loading: false, error: "Network error", data: null });
    }
  }, [url]);

  useEffect(() => {
    if (isOpen && !state.data && !state.loading) {
      fetchData();
    }
  }, [isOpen, state.data, state.loading, fetchData]);

  return state;
}

export default function LearnerAnalytics() {
  const [isOpen, setIsOpen] = useState(false);

  const xp = useAnalyticsFetch<XPOverTimeResponse>("/api/analytics/xp-over-time", isOpen);
  const activity = useAnalyticsFetch<ActivityHeatmapResponse>("/api/analytics/activity-heatmap", isOpen);
  const mastery = useAnalyticsFetch<ConceptMasteryResponse>("/api/analytics/concept-mastery", isOpen);
  const assessments = useAnalyticsFetch<AssessmentScoresResponse>("/api/analytics/assessment-scores", isOpen);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left px-1 py-2 rounded hover:bg-[var(--accent)]/30 transition-colors cursor-pointer"
      >
        <svg
          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold">Analytics</span>
      </button>

      {isOpen && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ChartContainer
            title="XP Over Time"
            description="Cumulative and daily XP earned"
            loading={xp.loading}
            error={xp.error}
            empty={!xp.data?.points.length}
          >
            {xp.data && <XPOverTimeChart data={xp.data.points} />}
          </ChartContainer>

          <ChartContainer
            title="Activity"
            description="Exercises completed per day"
            loading={activity.loading}
            error={activity.error}
            empty={!activity.data?.days.length}
          >
            {activity.data && <ActivityHeatmap data={activity.data.days} />}
          </ChartContainer>

          <ChartContainer
            title="Concept Mastery"
            description="Completion across learning phases"
            loading={mastery.loading}
            error={mastery.error}
            empty={!mastery.data?.phases.length}
          >
            {mastery.data && <ConceptMasteryChart data={mastery.data.phases} />}
          </ChartContainer>

          <ChartContainer
            title="Assessment Scores"
            description="Entry vs exit assessment performance"
            loading={assessments.loading}
            error={assessments.error}
            empty={!assessments.data?.phases.length}
          >
            {assessments.data && (
              <AssessmentScoresChart data={assessments.data.phases} />
            )}
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
