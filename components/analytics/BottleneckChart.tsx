"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { BottleneckPhase } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly BottleneckPhase[];
}

function getBarColor(stuckCount: number, maxStuck: number): string {
  if (maxStuck === 0) return CHART_COLORS.muted;
  const ratio = stuckCount / maxStuck;
  if (ratio > 0.6) return CHART_COLORS.red;
  if (ratio > 0.3) return CHART_COLORS.amber;
  return CHART_COLORS.cta;
}

export default function BottleneckChart({ data }: Props) {
  const filtered = data.filter((p) => p.stuckCount > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--muted-foreground)] text-xs">
        No bottlenecks detected
      </div>
    );
  }

  const maxStuck = Math.max(...filtered.map((p) => p.stuckCount));
  const chartData = filtered.map((p) => ({
    phase: p.phaseTitle.replace(/^Phase \d+: /, "").slice(0, 14),
    stuck: p.stuckCount,
    avgDays: p.avgDaysStuck,
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
          <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.muted }} />
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
            formatter={(value, name, props) => {
              const v = value ?? 0;
              if (name === "stuck") {
                const avgDays = (props?.payload as Record<string, number> | undefined)?.avgDays ?? 0;
                return [`${v} members (avg ${avgDays}d)`, "Stuck"];
              }
              return [v, name ?? ""];
            }}
          />
          <Bar dataKey="stuck" name="Stuck Members" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.stuck, maxStuck)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
