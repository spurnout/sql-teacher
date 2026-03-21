"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";
import SqlEditor from "@/components/editor/SqlEditor";
import ResultsTable, {
  type ExecutionState,
} from "@/components/editor/ResultsTable";
import SchemaSidebar from "@/components/layout/SchemaSidebar";
import QueryHistory from "@/components/editor/QueryHistory";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { SchemaReference } from "@/content/schema/reference";

interface Props {
  readonly username: string;
  readonly schemaReference?: SchemaReference;
  readonly defaultTable: string;
}

export default function SandboxClient({ schemaReference, defaultTable }: Props) {
  const [sql, setSql] = useState(`SELECT * FROM ${defaultTable} LIMIT 10;`);
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle" });
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"schema" | "docs">("schema");

  const handleRun = useCallback(async () => {
    if (!sql.trim() || isRunning) return;
    setIsRunning(true);
    setExecution({ status: "running" });

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setExecution({ status: "error", message: data.error ?? "Unknown error" });
      } else {
        setExecution({
          status: "success",
          rows: data.rows,
          fields: data.fields,
          duration: data.duration,
          rowCount: data.rowCount,
        });
      }
    } catch {
      setExecution({ status: "error", message: "Network error" });
    } finally {
      setIsRunning(false);
    }
  }, [sql, isRunning]);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Sandbox</span>
        </div>
        <div className="flex items-center gap-4">
          <QueryHistory onSelectQuery={setSql} />
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* Editor + Results */}
          <ResizablePanel defaultSize={70} minSize={40}>
            <ResizablePanelGroup orientation="vertical">
              {/* SQL Editor */}
              <ResizablePanel defaultSize={50} minSize={25}>
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  onRun={handleRun}
                  isRunning={isRunning}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Results */}
              <ResizablePanel defaultSize={50} minSize={20}>
                <ResultsTable execution={execution} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Schema sidebar */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <SchemaSidebar
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              schemaReference={schemaReference}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
