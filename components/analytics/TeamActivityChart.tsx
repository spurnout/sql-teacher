"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { TeamActivityWeek } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly TeamActivityWeek[];
}

export default function TeamActivityChart({ data }: Props) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="teamActivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
          <XAxis
            dataKey="weekStart"
            tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.muted }} width={35} />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.card,
              border: `1px solid ${CHART_COLORS.border}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="exercisesCompleted"
            stroke={CHART_COLORS.primary}
            fill="url(#teamActivityGradient)"
            strokeWidth={2}
            name="Exercises"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
