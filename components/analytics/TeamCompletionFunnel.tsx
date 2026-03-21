"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { FunnelPhase } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly FunnelPhase[];
  readonly totalMembers: number;
}

export default function TeamCompletionFunnel({ data, totalMembers }: Props) {
  const chartData = data.map((p) => ({
    phase: p.phaseTitle.replace(/^Phase \d+: /, "").slice(0, 12),
    Completed: p.membersReached,
    "In Progress": p.membersCurrently,
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
          <XAxis
            type="number"
            domain={[0, totalMembers]}
            tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
          />
          <YAxis
            type="category"
            dataKey="phase"
            tick={{ fontSize: 9, fill: CHART_COLORS.muted }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.card,
              border: `1px solid ${CHART_COLORS.border}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Completed" stackId="a" fill={CHART_COLORS.cta} radius={[0, 0, 0, 0]} />
          <Bar dataKey="In Progress" stackId="a" fill={CHART_COLORS.amber} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
