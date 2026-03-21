"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "./ChartContainer";
import type { XPDataPoint } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly XPDataPoint[];
}

export default function XPOverTimeChart({ data }: Props) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
            tickFormatter={(v: string) => v.slice(5)}
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
          <Line
            type="monotone"
            dataKey="cumulativeXP"
            stroke={CHART_COLORS.cta}
            strokeWidth={2}
            dot={false}
            name="Total XP"
          />
          <Line
            type="monotone"
            dataKey="dailyXP"
            stroke={CHART_COLORS.amber}
            strokeWidth={1}
            dot={false}
            opacity={0.6}
            name="Daily XP"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
