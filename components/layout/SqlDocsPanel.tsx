"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SqlDocSection } from "@/content/sql-docs/index";

interface Props {
  readonly relevantSections: readonly SqlDocSection[];
  readonly allSections: readonly SqlDocSection[];
}

export default function SqlDocsPanel({ relevantSections, allSections }: Props) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter.trim()
    ? allSections.filter((s) =>
        s.title.toLowerCase().includes(filter.toLowerCase())
      )
    : null;

  // Sections to show: filtered list or grouped (relevant + rest)
  const relevantIds = new Set(relevantSections.map((s) => s.id));
  const otherSections = allSections.filter((s) => !relevantIds.has(s.id));

  const toggle = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const renderSection = (section: SqlDocSection) => {
    const isOpen = expanded === section.id;
    return (
      <div
        key={section.id}
        className="border-b border-[var(--border)]/50 last:border-0"
      >
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium hover:bg-[var(--accent)]/30 transition-colors"
          onClick={() => toggle(section.id)}
        >
          <span className={isOpen ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>
            {section.title}
          </span>
          <span
            className="text-[var(--muted-foreground)] text-[10px] shrink-0 ml-1"
            aria-hidden="true"
          >
            {isOpen ? "▲" : "▼"}
          </span>
        </button>
        {isOpen && (
          <div className="px-3 pb-3 pt-1">
            <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-[var(--background)] [&_pre]:p-2 [&_pre]:rounded [&_pre]:border [&_pre]:border-[var(--border)] [&_code]:text-blue-300 [&_code]:text-[11px] [&_strong]:text-[var(--foreground)] [&_p]:text-[var(--foreground)]/85 [&_p]:text-xs [&_li]:text-[var(--foreground)]/85 [&_li]:text-xs [&_table]:text-xs [&_th]:text-[var(--muted-foreground)] [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-[var(--foreground)] [&_h2]:mt-0">
              <Markdown>{section.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-[var(--border)]">
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search docs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 text-xs bg-[var(--accent)]/30 border border-[var(--border)] rounded text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered ? (
          // Filtered results
          <div>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[var(--muted-foreground)] text-center">
                No results for &ldquo;{filter}&rdquo;
              </p>
            ) : (
              filtered.map(renderSection)
            )}
          </div>
        ) : (
          // Default grouped view
          <div>
            {relevantSections.length > 0 && (
              <>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Relevant to this exercise
                </p>
                {relevantSections.map(renderSection)}
              </>
            )}
            {otherSections.length > 0 && (
              <>
                {relevantSections.length > 0 && (
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] border-t border-[var(--border)] mt-1">
                    All topics
                  </p>
                )}
                {otherSections.map(renderSection)}
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
