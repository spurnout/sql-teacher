"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  BookOpen,
} from "lucide-react";

interface CustomThemeSummary {
  readonly id: number;
  readonly orgId: number;
  readonly orgName: string;
  readonly orgSlug: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: "pending" | "provisioned" | "error";
  readonly errorMessage: string | null;
  readonly createdAt: string;
}

interface ExerciseCounts {
  readonly [themeId: number]: number;
}

export default function AdminCustomDbsTab() {
  const [themes, setThemes] = useState<readonly CustomThemeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Retry provisioning
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // Exercise counts per theme
  const [exerciseCounts, setExerciseCounts] = useState<ExerciseCounts>({});

  // Import exercises state
  const [importingId, setImportingId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/custom-themes");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setThemes(data.themes ?? []);
      setError(null);
    } catch {
      setError("Failed to load custom themes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExerciseCounts = useCallback(
    async (themeList: readonly CustomThemeSummary[]) => {
      const counts: Record<number, number> = {};
      await Promise.all(
        themeList
          .filter((t) => t.status === "provisioned")
          .map(async (t) => {
            try {
              const res = await fetch(
                `/api/custom-themes/${t.id}/exercises`
              );
              if (res.ok) {
                const data = await res.json();
                counts[t.id] = Array.isArray(data.exercises)
                  ? data.exercises.length
                  : 0;
              }
            } catch {
              // ignore — count will stay undefined
            }
          })
      );
      setExerciseCounts(counts);
    },
    []
  );

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // Fetch exercise counts whenever themes change
  useEffect(() => {
    if (themes.length > 0) {
      fetchExerciseCounts(themes);
    }
  }, [themes, fetchExerciseCounts]);

  const handleExport = async (themeId: number, slug: string) => {
    try {
      const res = await fetch(`/api/custom-themes/${themeId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Export failed: ${(data as Record<string, unknown>).error ?? res.statusText}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `theme-${slug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed — network error.");
    }
  };

  const handleExportExercises = async (themeId: number, slug: string) => {
    try {
      const res = await fetch(
        `/api/custom-themes/${themeId}/exercises/export`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Export failed: ${(data as Record<string, unknown>).error ?? res.statusText}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exercises-${slug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed — network error.");
    }
  };

  const handleImportExercises = (themeId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImportingId(themeId);
      setImportResult(null);
      setImportError(null);
      try {
        const text = await file.text();
        const body = JSON.parse(text);
        const res = await fetch(
          `/api/custom-themes/${themeId}/exercises/import`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json();
        if (res.ok) {
          setImportResult(
            `Imported ${data.imported} exercise(s)${data.skipped > 0 ? `, ${data.skipped} skipped` : ""}`
          );
          await fetchExerciseCounts(themes);
        } else {
          setImportError(data.error ?? "Import failed.");
        }
      } catch {
        setImportError("Invalid JSON file or network error.");
      } finally {
        setImportingId(null);
      }
    };
    input.click();
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/custom-themes/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        await fetchThemes();
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to delete theme.");
      }
    } catch {
      setDeleteError("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  // Retry error feedback
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async (themeId: number) => {
    setRetryingId(themeId);
    setRetryError(null);
    try {
      const res = await fetch(`/api/admin/custom-themes/${themeId}`, {
        method: "PATCH",
      });
      // Always refresh to show updated status/error message
      await fetchThemes();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRetryError(
          (data as Record<string, unknown>).error as string ??
            "Provisioning failed."
        );
      }
    } catch {
      setRetryError("Network error during retry.");
      await fetchThemes();
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400 py-4">{error}</p>;
  }

  if (themes.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No custom databases uploaded yet.</p>
      </div>
    );
  }

  return (
    <div>
      {retryError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <p className="text-xs text-red-400">{retryError}</p>
          <button
            type="button"
            onClick={() => setRetryError(null)}
            className="text-xs text-red-400 hover:text-red-300 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
      {importResult && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <p className="text-xs text-emerald-400">{importResult}</p>
          <button
            type="button"
            onClick={() => setImportResult(null)}
            className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
      {importError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <p className="text-xs text-red-400">{importError}</p>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-xs text-red-400 hover:text-red-300 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Database
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Team
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Error
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Exercises
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Created
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {themes.map((theme) => (
              <tr
                key={theme.id}
                className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent)]/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {theme.slug}
                    </p>
                    {theme.description && (
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 line-clamp-1">
                        {theme.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  <div>
                    <p className="text-sm">{theme.orgName}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {theme.orgSlug}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={theme.status} />
                </td>
                <td className="px-4 py-3">
                  {theme.errorMessage && (
                    <p className="text-xs text-red-400 max-w-[200px] truncate" title={theme.errorMessage}>
                      {theme.errorMessage}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {theme.status === "provisioned" ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-400">
                      <BookOpen className="w-3 h-3" />
                      {exerciseCounts[theme.id] ?? 0}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">
                  {formatDate(theme.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {theme.status === "provisioned" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleExport(theme.id, theme.slug)}
                          className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                          title="Export theme bundle (JSON)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleExportExercises(theme.id, theme.slug)
                          }
                          className="p-1.5 rounded hover:bg-blue-500/10 text-[var(--muted-foreground)] hover:text-blue-400 transition-colors cursor-pointer"
                          title="Export exercises (JSON)"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImportExercises(theme.id)}
                          disabled={importingId === theme.id}
                          className="p-1.5 rounded hover:bg-emerald-500/10 text-[var(--muted-foreground)] hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="Import exercises (JSON)"
                        >
                          {importingId === theme.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                    {(theme.status === "error" || theme.status === "pending") && (
                      <button
                        type="button"
                        onClick={() => handleRetry(theme.id)}
                        disabled={retryingId === theme.id}
                        className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
                        title="Retry provisioning"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            retryingId === theme.id ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteId(theme.id)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete custom database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-red-400">
              Delete Custom Database
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Are you sure you want to delete{" "}
              <strong>
                {themes.find((t) => t.id === deleteId)?.name}
              </strong>
              ? This will drop the associated database schema and cannot be
              undone.
            </p>
            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge sub-component
// ---------------------------------------------------------------------------

function StatusBadge({
  status,
}: {
  readonly status: "pending" | "provisioned" | "error";
}) {
  switch (status) {
    case "provisioned":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-400/20 text-red-400">
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
  }
}
