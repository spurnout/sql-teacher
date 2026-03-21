"use client";

import { useState, useEffect, useCallback } from "react";
import ChartContainer from "@/components/analytics/ChartContainer";
import TeamCompletionFunnel from "@/components/analytics/TeamCompletionFunnel";
import TeamActivityChart from "@/components/analytics/TeamActivityChart";
import MemberComparisonChart from "@/components/analytics/MemberComparisonChart";
import BottleneckChart from "@/components/analytics/BottleneckChart";
import type {
  CompletionFunnelResponse,
  TeamActivityResponse,
  MemberComparisonResponse,
  BottleneckResponse,
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

export default function TeamAnalytics() {
  const [isOpen, setIsOpen] = useState(false);

  const funnel = useAnalyticsFetch<CompletionFunnelResponse>("/api/analytics/team/completion-funnel", isOpen);
  const activity = useAnalyticsFetch<TeamActivityResponse>("/api/analytics/team/activity-over-time", isOpen);
  const comparison = useAnalyticsFetch<MemberComparisonResponse>("/api/analytics/team/member-comparison", isOpen);
  const bottlenecks = useAnalyticsFetch<BottleneckResponse>("/api/analytics/team/bottlenecks", isOpen);

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
        <span className="text-sm font-semibold">Team Analytics</span>
      </button>

      {isOpen && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ChartContainer
            title="Completion Funnel"
            description="Members who reached each phase"
            loading={funnel.loading}
            error={funnel.error}
            empty={!funnel.data?.phases.length}
          >
            {funnel.data && (
              <TeamCompletionFunnel
                data={funnel.data.phases}
                totalMembers={funnel.data.totalMembers}
              />
            )}
          </ChartContainer>

          <ChartContainer
            title="Team Activity"
            description="Exercises completed per week"
            loading={activity.loading}
            error={activity.error}
            empty={!activity.data?.weeks.length}
          >
            {activity.data && <TeamActivityChart data={activity.data.weeks} />}
          </ChartContainer>

          <ChartContainer
            title="Top Members"
            description="Ranked by total XP"
            loading={comparison.loading}
            error={comparison.error}
            empty={!comparison.data?.members.length}
          >
            {comparison.data && (
              <MemberComparisonChart data={comparison.data.members} />
            )}
          </ChartContainer>

          <ChartContainer
            title="Bottlenecks"
            description="Phases where members are stuck"
            loading={bottlenecks.loading}
            error={bottlenecks.error}
            empty={!bottlenecks.data?.phases.length}
          >
            {bottlenecks.data && (
              <BottleneckChart data={bottlenecks.data.phases} />
            )}
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
