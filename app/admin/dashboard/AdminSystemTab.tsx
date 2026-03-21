"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  HardDrive,
  Database,
  Activity,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemInfo {
  readonly dbPool: {
    readonly totalConnections: number;
    readonly idleConnections: number;
    readonly waitingClients: number;
  };
  readonly dbStats: {
    readonly totalTables: number;
    readonly totalRows: number;
    readonly dbSizePretty: string;
    readonly cacheHitRatio: number;
  };
  readonly tableStats: readonly {
    readonly tableName: string;
    readonly rowCount: number;
    readonly sizePretty: string;
  }[];
}

// ---------------------------------------------------------------------------
// SummaryCard sub-component
// ---------------------------------------------------------------------------

function InfoCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly icon: typeof Server;
  readonly color?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color ?? "text-[var(--muted-foreground)]"}`} />
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      </div>
      <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSystemTab() {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/admin/system");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json as SystemInfo);
      setError(null);
    } catch {
      setError("Failed to load system info.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading system info…
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-16 text-red-400">{error}</div>;
  }

  if (!data) return null;

  const poolHealthColor =
    data.dbPool.waitingClients > 0
      ? "text-amber-400"
      : data.dbPool.idleConnections > 0
        ? "text-emerald-400"
        : "text-red-400";

  const cacheColor =
    data.dbStats.cacheHitRatio >= 99
      ? "text-emerald-400"
      : data.dbStats.cacheHitRatio >= 90
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-8">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Connection Pool */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--cta)]" />
          Connection Pool
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <InfoCard
            label="Total Connections"
            value={data.dbPool.totalConnections}
            icon={Server}
            color={poolHealthColor}
          />
          <InfoCard
            label="Idle Connections"
            value={data.dbPool.idleConnections}
            icon={Server}
            color="text-emerald-400"
          />
          <InfoCard
            label="Waiting Clients"
            value={data.dbPool.waitingClients}
            icon={Server}
            color={data.dbPool.waitingClients > 0 ? "text-amber-400" : "text-emerald-400"}
          />
        </div>
      </section>

      {/* Database Overview */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Database Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard
            label="Total Tables"
            value={data.dbStats.totalTables}
            icon={Database}
            color="text-blue-400"
          />
          <InfoCard
            label="Total Rows"
            value={data.dbStats.totalRows.toLocaleString()}
            icon={Database}
            color="text-blue-400"
          />
          <InfoCard
            label="Database Size"
            value={data.dbStats.dbSizePretty}
            icon={HardDrive}
            color="text-purple-400"
          />
          <InfoCard
            label="Cache Hit Ratio"
            value={`${data.dbStats.cacheHitRatio}%`}
            icon={Activity}
            color={cacheColor}
          />
        </div>
      </section>

      {/* Table Sizes */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-purple-400" />
          Table Sizes (Top 20)
        </h3>

        {data.tableStats.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No table data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">Table Name</th>
                  <th className="py-2 pr-3 font-medium text-right">Row Count</th>
                  <th className="py-2 font-medium text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {data.tableStats.map((table) => (
                  <tr
                    key={table.tableName}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[var(--foreground)] font-mono text-xs">
                      {table.tableName}
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {table.rowCount.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-[var(--muted-foreground)]">
                      {table.sizePretty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
