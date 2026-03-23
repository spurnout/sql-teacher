"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Database, ArrowLeft, Shield, ChevronDown } from "lucide-react";
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

interface SchemaItem {
  readonly id: string;
  readonly name: string;
  readonly dbSchema: string;
  readonly type: "builtin" | "custom";
}

interface Props {
  readonly username: string;
  readonly schemaReference?: SchemaReference;
  readonly defaultTable: string;
  readonly activeSchema: string;
}

export default function StudioClient({
  schemaReference: initialSchemaRef,
  defaultTable,
  activeSchema: initialSchema,
}: Props) {
  const [sql, setSql] = useState(
    `SELECT * FROM ${needsQuoting(defaultTable) ? `"${defaultTable}"` : defaultTable} LIMIT 10;`
  );
  const [execution, setExecution] = useState<ExecutionState>({
    status: "idle",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"schema" | "docs">("schema");

  // Schema switcher state
  const [selectedSchema, setSelectedSchema] = useState(initialSchema);
  const [schemas, setSchemas] = useState<readonly SchemaItem[]>([]);
  const [showSchemaPicker, setShowSchemaPicker] = useState(false);
  const [schemaReference, setSchemaReference] = useState(initialSchemaRef);

  // Load available schemas on mount
  useEffect(() => {
    fetch("/api/admin/schemas")
      .then((r) => r.json())
      .then((data) => {
        if (data.schemas) setSchemas(data.schemas);
      })
      .catch(() => {});
  }, []);

  const currentSchemaName =
    schemas.find((s) => s.dbSchema === selectedSchema)?.name ??
    selectedSchema;

  const handleSchemaChange = useCallback(
    (schema: SchemaItem) => {
      setSelectedSchema(schema.dbSchema);
      setShowSchemaPicker(false);
      // Reset schema reference — we'd need to load it from the server
      // For now, clear it so the sidebar shows "loading" state
      if (schema.type === "custom") {
        // Load schema ref for custom themes
        fetch(`/api/admin/schemas`)
          .then((r) => r.json())
          .then(() => {
            // Schema ref loading would require an additional endpoint
            // For now, just clear it
            setSchemaReference(undefined);
          })
          .catch(() => {});
      } else {
        // Builtin themes — schema ref is server-rendered, we don't have it client-side
        // after switching. Clear to show the schema will be different.
        setSchemaReference(undefined);
      }
    },
    []
  );

  const handleRun = useCallback(async () => {
    if (!sql.trim() || isRunning) return;
    setIsRunning(true);
    setExecution({ status: "running" });

    try {
      const res = await fetch("/api/admin/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, themeSchema: selectedSchema }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setExecution({
          status: "error",
          message: data.error ?? "Unknown error",
        });
      } else if (data.type === "select") {
        setExecution({
          status: "success",
          rows: data.rows,
          fields: data.fields,
          duration: data.duration,
          rowCount: data.rowCount,
        });
      } else {
        // DML/DDL command result
        setExecution({
          status: "command",
          command: data.command,
          rowCount: data.rowCount,
          duration: data.duration,
        });
      }
    } catch {
      setExecution({ status: "error", message: "Network error" });
    } finally {
      setIsRunning(false);
    }
  }, [sql, isRunning, selectedSchema]);

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">
            SQL Teacher
          </span>
          <span
            className="text-[var(--border)] text-xs"
            aria-hidden="true"
          >
            /
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            SQL Studio
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Shield className="w-3 h-3" aria-hidden="true" />
            Admin — Full Read/Write
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Schema switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSchemaPicker(!showSchemaPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
            >
              <Database className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="max-w-[160px] truncate">
                {currentSchemaName}
              </span>
              <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
            </button>
            {showSchemaPicker && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                {schemas.length === 0 && (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                    Loading...
                  </div>
                )}
                {schemas.map((s) => (
                  <button
                    key={s.dbSchema}
                    onClick={() => handleSchemaChange(s)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--accent)] transition-colors flex items-center justify-between ${
                      s.dbSchema === selectedSchema
                        ? "text-[var(--cta)] bg-[var(--cta)]/5"
                        : ""
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        s.type === "custom"
                          ? "bg-purple-500/15 text-purple-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <QueryHistory onSelectQuery={setSql} />
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Admin
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

/** Check if a table name needs double-quoting (contains uppercase or special chars) */
function needsQuoting(name: string): boolean {
  return /[A-Z\s-]/.test(name);
}
