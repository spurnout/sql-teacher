"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Field {
  readonly name: string;
  readonly dataTypeID: number;
}

export type ExecutionState =
  | { readonly status: "idle" }
  | { readonly status: "running" }
  | {
      readonly status: "success";
      readonly rows: Record<string, unknown>[];
      readonly fields: Field[];
      readonly duration: number;
      readonly rowCount: number;
    }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "command";
      readonly command: string;
      readonly rowCount: number;
      readonly duration: number;
    };

interface Props {
  readonly execution: ExecutionState;
}

export default function ResultsTable({ execution }: Props) {
  if (execution.status === "idle") {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        Run a query to see results
      </div>
    );
  }

  if (execution.status === "running") {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)] text-sm">
        <div className="flex items-center gap-2">
          <Loader2
            className="h-4 w-4 animate-spin text-[var(--cta)]"
            aria-hidden="true"
          />
          Executing...
        </div>
      </div>
    );
  }

  if (execution.status === "error") {
    return (
      <div className="flex-1 p-4">
        <div className="bg-red-500/10 border border-red-500/25 rounded-md p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle
              className="w-4 h-4 text-red-400 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-red-400">Query Error</p>
          </div>
          <pre className="text-xs text-red-400/80 whitespace-pre-wrap font-mono leading-relaxed">
            {execution.message}
          </pre>
        </div>
      </div>
    );
  }

  if (execution.status === "command") {
    const { command, rowCount: affected, duration: dur } = execution;
    const label =
      affected > 0
        ? `${affected} ${affected === 1 ? "row" : "rows"} affected`
        : "OK";
    return (
      <div className="flex-1 p-4">
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-md p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2
              className="w-4 h-4 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-emerald-400">
              {command}
            </p>
          </div>
          <p className="text-xs text-emerald-400/80 font-mono">
            {label} ({dur}ms)
          </p>
        </div>
      </div>
    );
  }

  const { rows, fields, duration, rowCount } = execution;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Results metadata bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--card)] border-b border-[var(--border)]">
        <span className="text-xs font-mono text-[var(--cta)]">
          {rowCount} {rowCount === 1 ? "row" : "rows"}
        </span>
        <span className="text-[var(--border)]" aria-hidden="true">·</span>
        <span className="text-xs text-[var(--muted-foreground)] font-mono">
          {duration}ms
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--accent)]/40 sticky top-0">
                {fields.map((f) => (
                  <th
                    key={f.name}
                    className="px-3 py-2 text-left font-semibold font-mono border-b border-[var(--border)] whitespace-nowrap text-[var(--muted-foreground)] tracking-wide"
                  >
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-[var(--accent)]/20 border-b border-[var(--border)]/40 transition-colors duration-100"
                >
                  {fields.map((f) => (
                    <td
                      key={f.name}
                      className="px-3 py-1.5 font-mono whitespace-nowrap max-w-xs truncate"
                    >
                      {row[f.name] === null ? (
                        <span className="text-[var(--muted-foreground)]/50 italic">
                          NULL
                        </span>
                      ) : (
                        String(row[f.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
