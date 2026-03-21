"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Sparkles } from "lucide-react";

interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly icon: string;
  readonly tablePreview: readonly string[];
}

interface Props {
  readonly themes: readonly ThemeOption[];
  readonly currentTheme: string;
}

export default function ThemePickerClient({ themes, currentTheme }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentTheme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        router.push("/learn/phase-0/p0-select-star-worked");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-8 h-8 text-[var(--cta)]" />
            <span className="text-3xl font-bold tracking-tight">
              Choose Your Database
            </span>
          </div>
          <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
            Pick a theme for your learning journey. You&apos;ll practice the
            same SQL concepts, but with a database that matches your style. You
            can switch themes anytime from your dashboard.
          </p>
        </div>

        {/* Theme Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setSelected(theme.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                selected === theme.id
                  ? "border-[var(--cta)] bg-[var(--cta)]/5 shadow-lg shadow-[var(--cta)]/10"
                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]/40"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{theme.icon}</span>
                <div>
                  <h3 className="font-semibold text-base">{theme.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                    {theme.tagline}
                  </p>
                </div>
              </div>

              {/* Table preview */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {theme.tablePreview.map((table) => (
                  <span
                    key={table}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]"
                  >
                    {table}
                  </span>
                ))}
              </div>

              {selected === theme.id && (
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--cta)] font-medium">
                  <Sparkles className="w-3 h-3" />
                  Selected
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2 mb-4 text-center max-w-md mx-auto">
            {error}
          </p>
        )}

        {/* Continue button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSelect}
            disabled={loading}
            className="px-8 py-3 bg-[var(--cta)] text-[var(--cta-foreground)] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {loading ? "Setting up..." : "Start Learning →"}
          </button>
        </div>
      </div>
    </div>
  );
}
