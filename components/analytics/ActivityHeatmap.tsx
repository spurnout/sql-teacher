"use client";

import { useMemo } from "react";
import { CHART_COLORS } from "./ChartContainer";
import type { ActivityDay } from "@/lib/analytics/types";

interface Props {
  readonly data: readonly ActivityDay[];
}

const CELL_SIZE = 11;
const CELL_GAP = 2;
const WEEKS = 52;
const DAYS = 7;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColor(count: number): string {
  if (count === 0) return CHART_COLORS.border;
  if (count <= 1) return "#166534";
  if (count <= 3) return "#16a34a";
  if (count <= 6) return "#22c55e";
  return "#4ade80";
}

export default function ActivityHeatmap({ data }: Props) {
  const grid = useMemo(() => {
    const countMap = new Map(data.map((d) => [d.date, d.count]));
    const today = new Date();
    const cells: Array<{ x: number; y: number; date: string; count: number }> = [];

    // Start from 52 weeks ago, aligned to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7) + (7 - start.getDay()));

    for (let week = 0; week < WEEKS; week++) {
      for (let day = 0; day < DAYS; day++) {
        const d = new Date(start);
        d.setDate(d.getDate() + week * 7 + day);
        if (d > today) continue;
        const dateStr = d.toISOString().slice(0, 10);
        cells.push({
          x: week * (CELL_SIZE + CELL_GAP),
          y: day * (CELL_SIZE + CELL_GAP),
          date: dateStr,
          count: countMap.get(dateStr) ?? 0,
        });
      }
    }
    return cells;
  }, [data]);

  const svgWidth = WEEKS * (CELL_SIZE + CELL_GAP);
  const svgHeight = DAYS * (CELL_SIZE + CELL_GAP);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col justify-between pt-0 pr-1" style={{ height: svgHeight }}>
          {DAY_LABELS.map((label, i) => (
            <span
              key={i}
              className="text-[9px] text-[var(--muted-foreground)] leading-none"
              style={{ height: CELL_SIZE + CELL_GAP }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <svg width={svgWidth} height={svgHeight}>
          {grid.map((cell) => (
            <rect
              key={cell.date}
              x={cell.x}
              y={cell.y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={getColor(cell.count)}
              opacity={0.9}
            >
              <title>{`${cell.date}: ${cell.count} exercise${cell.count !== 1 ? "s" : ""}`}</title>
            </rect>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-[var(--muted-foreground)]">Less</span>
        {[0, 1, 3, 6, 10].map((n) => (
          <div
            key={n}
            className="rounded-sm"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              backgroundColor: getColor(n),
            }}
          />
        ))}
        <span className="text-[9px] text-[var(--muted-foreground)]">More</span>
      </div>
    </div>
  );
}
