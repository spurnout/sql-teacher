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
import type { PhaseAssessment } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly PhaseAssessment[];
}

export default function AssessmentScoresChart({ data }: Props) {
  const chartData = data
    .filter((p) => p.entryScore !== null || p.exitScore !== null)
    .map((p) => ({
      phase: p.phaseTitle.replace(/^Phase \d+: /, "").slice(0, 12),
      Entry: p.entryScore,
      Exit: p.exitScore,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--muted-foreground)] text-xs">
        No assessments taken yet
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
          <XAxis
            dataKey="phase"
            tick={{ fontSize: 9, fill: CHART_COLORS.muted }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.card,
              border: `1px solid ${CHART_COLORS.border}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) =>
              value != null ? [`${value}%`] : ["—"]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Entry" fill={CHART_COLORS.muted} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Exit" fill={CHART_COLORS.cta} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
