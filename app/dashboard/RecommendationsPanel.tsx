"use client";

import { useState, useEffect, useCallback } from "react";
import RecommendationCard from "@/components/adaptive/RecommendationCard";
import type { RecommendationsResponse } from "@/lib/adaptive/types";

export default function RecommendationsPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationsResponse | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/adaptive/recommendations");
      if (!res.ok) {
        setError("Failed to load recommendations");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as RecommendationsResponse;
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Don't render anything if no recommendations and not loading
  if (!loading && !error && data && data.recommendations.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" aria-hidden="true">
          &#x2B50;
        </span>
        <h2 className="text-base font-semibold">Your Learning Path</h2>
      </div>

      {loading && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 text-center">
          <div className="inline-block w-5 h-5 border-2 border-[var(--muted-foreground)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            Analyzing your progress...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-2 text-xs text-[var(--primary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && data.recommendations.length > 0 && (
        <div className="space-y-2">
          {data.recommendations.map((rec) => (
            <RecommendationCard
              key={`${rec.type}-${rec.exerciseId}`}
              recommendation={rec}
            />
          ))}
        </div>
      )}
    </div>
  );
}
