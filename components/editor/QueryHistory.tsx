"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X,
} from "lucide-react";

interface HistoryEntry {
  readonly id: number;
  readonly sqlText: string;
  readonly exerciseId: string | null;
  readonly success: boolean;
  readonly rowCount: number;
  readonly durationMs: number;
  readonly bookmarked: boolean;
  readonly executedAt: string;
}

interface Props {
  readonly onSelectQuery: (sql: string) => void;
  readonly exerciseId?: string;
}

export default function QueryHistory({ onSelectQuery, exerciseId }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "30" });
    if (showBookmarked) params.set("bookmarked", "true");
    if (searchText) params.set("search", searchText);
    if (exerciseId) params.set("exerciseId", exerciseId);

    try {
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [showBookmarked, searchText, exerciseId]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  const handleToggleBookmark = useCallback(
    async (id: number, currentBookmarked: boolean) => {
      await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, bookmarked: !currentBookmarked }),
      });
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, bookmarked: !currentBookmarked } : e
        )
      );
    },
    []
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
        title="Query History"
      >
        <History className="w-3.5 h-3.5" />
        History
      </button>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          Query History
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-0.5 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search + filter */}
      <div className="px-3 py-2 border-b border-[var(--border)] space-y-2">
        <div className="flex items-center gap-2 bg-[var(--accent)] rounded px-2 py-1">
          <Search className="w-3 h-3 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
          <input
            type="checkbox"
            checked={showBookmarked}
            onChange={(e) => setShowBookmarked(e.target.checked)}
            className="rounded"
          />
          Bookmarked only
        </label>
      </div>

      {/* Entries */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-[var(--muted-foreground)] p-3">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] p-3">No queries yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="px-3 py-2 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent)]/30 transition-colors cursor-pointer group"
              onClick={() => onSelectQuery(entry.sqlText)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{entry.sqlText}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {entry.success ? (
                      <span className="flex items-center gap-0.5 text-[var(--cta)]">
                        <CheckCircle className="w-2.5 h-2.5" />
                        {entry.rowCount} rows
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-red-400">
                        <XCircle className="w-2.5 h-2.5" />
                        Error
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.durationMs}ms
                    </span>
                    <span>{formatTime(entry.executedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBookmark(entry.id, entry.bookmarked);
                  }}
                  className="p-1 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-3 h-3 ${
                      entry.bookmarked
                        ? "text-amber-400 fill-amber-400"
                        : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
