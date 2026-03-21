"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { PhaseMastery } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly PhaseMastery[];
}

export default function ConceptMasteryChart({ data }: Props) {
  const chartData = data.map((p) => ({
    phase: p.phaseTitle.replace(/^Phase \d+: /, "").slice(0, 12),
    completionPct: p.completionPct,
    fullMark: 100,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke={CHART_COLORS.border} />
          <PolarAngleAxis
            dataKey="phase"
            tick={{ fontSize: 9, fill: CHART_COLORS.muted }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 8, fill: CHART_COLORS.muted }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.card,
              border: `1px solid ${CHART_COLORS.border}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value ?? 0}%`, "Completion"]}
          />
          <Radar
            name="Mastery"
            dataKey="completionPct"
            stroke={CHART_COLORS.primary}
            fill={CHART_COLORS.primary}
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
