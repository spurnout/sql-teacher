"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";

interface Props {
  readonly title: string;
  readonly children: React.ReactNode;
}

export default function AnalyticsSection({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left px-1 py-2 rounded hover:bg-[var(--accent)]/30 transition-colors cursor-pointer"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
        <TrendingUp className="w-4 h-4 text-[var(--cta)]" />
        <span className="text-sm font-semibold">{title}</span>
      </button>

      {isOpen && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
      )}
    </div>
  );
}
