"use client";

import { BarChart3 } from "lucide-react";

/** Chart color palette matching the app's CSS variables. */
export const CHART_COLORS = {
  primary: "#3b82f6",
  cta: "#22c55e",
  amber: "#f59e0b",
  orange: "#f97316",
  muted: "#94a3b8",
  card: "#1e293b",
  border: "#334155",
  red: "#ef4444",
  purple: "#a855f7",
  cyan: "#06b6d4",
} as const;

interface Props {
  readonly title: string;
  readonly description?: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly empty: boolean;
  readonly children: React.ReactNode;
}

export default function ChartContainer({
  title,
  description,
  loading,
  error,
  empty,
  children,
}: Props) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {description}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-[var(--muted-foreground)]">
          <div className="animate-pulse text-xs">Loading...</div>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center h-48 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && empty && (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--muted-foreground)]">
          <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
          <span className="text-xs">No data yet</span>
        </div>
      )}

      {!loading && !error && !empty && children}
    </div>
  );
}
