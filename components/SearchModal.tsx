"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchExercise {
  readonly id: string;
  readonly title: string;
  readonly concept: string;
  readonly phase: string;
  readonly phaseTitle: string;
}

interface Props {
  readonly exercises: readonly SearchExercise[];
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function SearchModal({ exercises, open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timerId = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timerId);
  }, [open]);

  // Escape key closes modal — Ctrl+K is handled by the parent (DashboardClient)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (exercise: SearchExercise) => {
      onClose();
      router.push(`/learn/${exercise.phase}/${exercise.id}`);
    },
    [router, onClose]
  );

  if (!open) return null;

  const lowerQuery = query.toLowerCase().trim();
  const filtered = lowerQuery
    ? exercises.filter(
        (e) =>
          e.title.toLowerCase().includes(lowerQuery) ||
          e.concept.toLowerCase().includes(lowerQuery) ||
          e.phaseTitle.toLowerCase().includes(lowerQuery)
      )
    : [];

  // Group results by phase
  const grouped = new Map<string, { phaseTitle: string; exercises: SearchExercise[] }>();
  for (const ex of filtered.slice(0, 20)) {
    const existing = grouped.get(ex.phase);
    if (existing) {
      existing.exercises.push(ex);
    } else {
      grouped.set(ex.phase, { phaseTitle: ex.phaseTitle, exercises: [ex] });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises by title, concept, or phase..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {lowerQuery && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No exercises match &ldquo;{query}&rdquo;
            </div>
          )}

          {!lowerQuery && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              Start typing to search {exercises.length} exercises...
            </div>
          )}

          {Array.from(grouped.entries()).map(([phaseId, group]) => (
            <div key={phaseId}>
              <div className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--accent)]/50">
                {group.phaseTitle}
              </div>
              {group.exercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelect(ex)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--accent)] transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium">{ex.title}</p>
                    {ex.concept && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ex.concept}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                    →
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
          <span>
            {filtered.length > 20
              ? `Showing 20 of ${filtered.length} results`
              : filtered.length > 0
                ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
                : ""}
          </span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
