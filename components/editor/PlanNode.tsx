"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface PlanNodeData {
  readonly "Node Type": string;
  readonly "Relation Name"?: string;
  readonly "Index Name"?: string;
  readonly "Join Type"?: string;
  readonly "Strategy"?: string;
  readonly "Actual Rows": number;
  readonly "Plan Rows": number;
  readonly "Actual Total Time": number;
  readonly "Total Cost": number;
  readonly "Startup Cost": number;
  readonly "Actual Startup Time": number;
  readonly Plans?: readonly PlanNodeData[];
  readonly [key: string]: unknown;
}

/** Map node types to colors */
function getNodeColor(nodeType: string): string {
  const type = nodeType.toLowerCase();
  if (type.includes("seq scan")) return "border-red-400 bg-red-400/10";
  if (type.includes("index")) return "border-emerald-400 bg-emerald-400/10";
  if (type.includes("sort")) return "border-amber-400 bg-amber-400/10";
  if (type.includes("hash") || type.includes("merge") || type.includes("nested"))
    return "border-blue-400 bg-blue-400/10";
  if (type.includes("aggregate")) return "border-purple-400 bg-purple-400/10";
  return "border-[var(--border)] bg-[var(--accent)]/30";
}

function getNodeLabel(nodeType: string): string {
  const type = nodeType.toLowerCase();
  if (type.includes("seq scan")) return "SEQ";
  if (type.includes("index scan")) return "IDX";
  if (type.includes("index only")) return "IDX";
  if (type.includes("bitmap")) return "BMP";
  if (type.includes("sort")) return "SRT";
  if (type.includes("hash join")) return "HJ";
  if (type.includes("merge join")) return "MJ";
  if (type.includes("nested")) return "NL";
  if (type.includes("aggregate")) return "AGG";
  if (type.includes("limit")) return "LIM";
  if (type.includes("append")) return "APP";
  return nodeType.substring(0, 3).toUpperCase();
}

interface Props {
  readonly node: PlanNodeData;
  readonly depth?: number;
}

export default function PlanNode({ node, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (node.Plans?.length ?? 0) > 0;
  const colorClass = getNodeColor(node["Node Type"]);
  const label = getNodeLabel(node["Node Type"]);

  const rowAccuracy =
    node["Plan Rows"] > 0
      ? Math.round((node["Actual Rows"] / node["Plan Rows"]) * 100)
      : 0;

  return (
    <div className={depth > 0 ? "ml-6 mt-2" : ""}>
      <div
        className={`border rounded-lg p-3 ${colorClass} cursor-pointer transition-all hover:shadow-sm`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
            )
          )}

          {/* Type badge */}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 text-[var(--foreground)]">
            {label}
          </span>

          {/* Node type */}
          <span className="text-xs font-semibold">{node["Node Type"]}</span>

          {/* Relation/index */}
          {node["Relation Name"] && (
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
              on {node["Relation Name"]}
            </span>
          )}
          {node["Index Name"] && (
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
              using {node["Index Name"]}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--muted-foreground)]">
          <span>
            Rows: <span className="font-medium text-[var(--foreground)]">{node["Actual Rows"]}</span>
            <span className="ml-1">
              (est. {node["Plan Rows"]}{" "}
              {rowAccuracy !== 100 && (
                <span
                  className={
                    rowAccuracy > 200 || rowAccuracy < 50
                      ? "text-red-400"
                      : "text-[var(--muted-foreground)]"
                  }
                >
                  {rowAccuracy}%
                </span>
              )}
              )
            </span>
          </span>
          <span>
            Time: <span className="font-medium text-[var(--foreground)]">{node["Actual Total Time"].toFixed(2)}ms</span>
          </span>
          <span>
            Cost: <span className="font-medium text-[var(--foreground)]">{node["Total Cost"].toFixed(1)}</span>
          </span>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-l-2 border-[var(--border)] ml-4">
          {node.Plans!.map((child, i) => (
            <PlanNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
