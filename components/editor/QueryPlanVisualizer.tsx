"use client";

import { useState, useCallback } from "react";
import { BarChart3, X, Loader2, AlertCircle } from "lucide-react";
import PlanNode, { type PlanNodeData } from "./PlanNode";

interface Props {
  readonly sql: string;
}

type PlanState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly plan: PlanNodeData }
  | { readonly status: "error"; readonly message: string };

export default function QueryPlanVisualizer({ sql }: Props) {
  const [planState, setPlanState] = useState<PlanState>({ status: "idle" });
  const [isOpen, setIsOpen] = useState(false);

  const handleExplain = useCallback(async () => {
    if (!sql.trim()) return;
    setIsOpen(true);
    setPlanState({ status: "loading" });

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setPlanState({
          status: "error",
          message: data.error ?? "Unknown error",
        });
        return;
      }

      // PostgreSQL returns plan as [{ Plan: { ... } }]
      const planArray = data.plan;
      if (Array.isArray(planArray) && planArray[0]?.Plan) {
        setPlanState({ status: "success", plan: planArray[0].Plan });
      } else {
        setPlanState({
          status: "error",
          message: "Unexpected plan format",
        });
      }
    } catch {
      setPlanState({ status: "error", message: "Network error" });
    }
  }, [sql]);

  return (
    <>
      {/* Explain button */}
      <button
        onClick={handleExplain}
        disabled={!sql.trim()}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50 cursor-pointer"
        title="Explain Query Plan"
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Explain
      </button>

      {/* Plan overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-[700px] max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                Query Execution Plan
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setPlanState({ status: "idle" });
                }}
                className="p-1 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2 border-b border-[var(--border)] text-[10px] shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-400" /> Seq Scan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Index Scan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Sort
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-400" /> Join
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-400" /> Aggregate
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {planState.status === "loading" && (
                <div className="flex items-center justify-center py-12 text-sm text-[var(--muted-foreground)]">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing query plan...
                </div>
              )}

              {planState.status === "error" && (
                <div className="flex items-center gap-2 py-8 justify-center text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {planState.message}
                </div>
              )}

              {planState.status === "success" && (
                <div>
                  {/* Summary */}
                  <div className="mb-4 p-3 bg-[var(--accent)]/50 rounded-lg text-xs space-y-1">
                    <p>
                      <span className="text-[var(--muted-foreground)]">Total Time:</span>{" "}
                      <span className="font-semibold">
                        {planState.plan["Actual Total Time"].toFixed(2)}ms
                      </span>
                    </p>
                    <p>
                      <span className="text-[var(--muted-foreground)]">Rows Returned:</span>{" "}
                      <span className="font-semibold">
                        {planState.plan["Actual Rows"]}
                      </span>
                    </p>
                  </div>

                  {/* Tree */}
                  <PlanNode node={planState.plan} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
