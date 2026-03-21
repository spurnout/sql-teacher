"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Filter, Clock, Loader2, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  readonly id: number;
  readonly adminId: number;
  readonly adminUsername: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  readonly details: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly createdAt: string;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "user.create", label: "User Created" },
  { value: "user.delete", label: "User Deleted" },
  { value: "user.password_reset", label: "Password Reset" },
  { value: "user.bulk_import", label: "Bulk Import" },
  { value: "team.delete", label: "Team Deleted" },
  { value: "theme.delete", label: "Theme Deleted" },
  { value: "theme.retry", label: "Theme Retry" },
] as const;

const ACTION_COLORS: Record<string, string> = {
  "user.create": "bg-emerald-900/50 text-emerald-400",
  "user.delete": "bg-red-900/50 text-red-400",
  "user.password_reset": "bg-amber-900/50 text-amber-400",
  "user.bulk_import": "bg-blue-900/50 text-blue-400",
  "team.delete": "bg-red-900/50 text-red-400",
  "theme.delete": "bg-red-900/50 text-red-400",
  "theme.retry": "bg-purple-900/50 text-purple-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return "—";
  const entries = Object.entries(details);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(", ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

export default function AdminAuditTab() {
  const [entries, setEntries] = useState<readonly AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [offset, setOffset] = useState(0);

  const fetchData = useCallback(async (newOffset: number, action: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(newOffset),
      });
      if (action) params.set("action", action);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setEntries(json.entries as AuditLogEntry[]);
      setTotal(json.total as number);
      setError(null);
    } catch {
      setError("Failed to load audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(offset, actionFilter);
  }, [fetchData, offset, actionFilter]);

  const handleFilterChange = (action: string) => {
    setActionFilter(action);
    setOffset(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="appearance-none bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-1.5 pr-8 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--cta)]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-12 text-red-400">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <ScrollText className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No audit log entries yet. Admin actions will be recorded here.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && entries.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Time
                  </th>
                  <th className="py-2 pr-3 font-medium">Admin</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[var(--muted-foreground)] whitespace-nowrap">
                      {formatRelativeTime(entry.createdAt)}
                    </td>
                    <td className="py-2 pr-3 text-[var(--foreground)]">
                      {entry.adminUsername}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          ACTION_COLORS[entry.action] ??
                          "bg-[var(--accent)] text-[var(--foreground)]"
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[var(--foreground)]">
                      {entry.targetType}
                      {entry.targetId ? ` #${entry.targetId}` : ""}
                    </td>
                    <td className="py-2 text-[var(--muted-foreground)] max-w-xs truncate">
                      {formatDetails(entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="px-3 py-1.5 text-xs rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] disabled:opacity-40 hover:bg-[var(--accent)] transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-[var(--muted-foreground)]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-xs rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] disabled:opacity-40 hover:bg-[var(--accent)] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
