"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { MemberStat } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly MemberStat[];
}

export default function MemberComparisonChart({ data }: Props) {
  const chartData = data.map((m) => ({
    name: m.username.length > 10 ? m.username.slice(0, 10) + "..." : m.username,
    XP: m.totalXP,
    Exercises: m.exercisesCompleted,
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: CHART_COLORS.muted }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.muted }} width={40} />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.card,
              border: `1px solid ${CHART_COLORS.border}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="XP" fill={CHART_COLORS.amber} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
