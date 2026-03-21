"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, BookOpen, GitBranch, List } from "lucide-react";
import { SCHEMA_REFERENCE, type SchemaReference } from "@/content/schema/reference";
import SqlDocsPanel from "./SqlDocsPanel";
import SchemaERD from "./SchemaERD";
import { SQL_DOCS, getRelevantDocs } from "@/content/sql-docs/index";

interface Props {
  readonly exerciseTags?: readonly string[];
  readonly activeTab?: "schema" | "docs";
  readonly onTabChange?: (tab: "schema" | "docs") => void;
  readonly schemaReference?: SchemaReference;
}

export default function SchemaSidebar({
  exerciseTags = [],
  activeTab = "schema",
  onTabChange,
  schemaReference,
}: Props) {
  const schema = schemaReference ?? SCHEMA_REFERENCE;
  const relevantDocs = getRelevantDocs(exerciseTags);
  const [schemaView, setSchemaView] = useState<"list" | "erd">("list");

  return (
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--card)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        <button
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px flex-1 justify-center cursor-pointer ${
            activeTab === "schema"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => onTabChange?.("schema")}
        >
          <Database className="w-3.5 h-3.5" aria-hidden="true" />
          Schema
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px flex-1 justify-center relative cursor-pointer ${
            activeTab === "docs"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => onTabChange?.("docs")}
        >
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          SQL Docs
          {relevantDocs.length > 0 && activeTab !== "docs" && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--cta)]" aria-label="Relevant docs available" />
          )}
        </button>
      </div>

      {/* Schema tab */}
      {activeTab === "schema" && (
        <>
          {/* View toggle */}
          <div className="flex items-center justify-end px-2 py-1.5 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center bg-[var(--accent)] rounded-md p-0.5">
              <button
                onClick={() => setSchemaView("list")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  schemaView === "list"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <List className="w-3 h-3" />
                List
              </button>
              <button
                onClick={() => setSchemaView("erd")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  schemaView === "erd"
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <GitBranch className="w-3 h-3" />
                ERD
              </button>
            </div>
          </div>

          {schemaView === "list" ? (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {schema.tables.map((table) => (
                  <div
                    key={table.name}
                    className="rounded-md border border-[var(--border)] overflow-hidden"
                  >
                    {/* Table header */}
                    <div className="px-2.5 py-1.5 bg-[var(--accent)]/40">
                      <p className="text-xs font-semibold text-[var(--primary)] font-mono">
                        {table.name}
                      </p>
                    </div>
                    {/* Columns */}
                    <div className="px-2.5 py-1.5 space-y-1">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-baseline gap-1.5 min-w-0"
                        >
                          <span className="text-xs font-mono text-[var(--foreground)] shrink-0">
                            {col.name}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)] font-mono shrink-0">
                            {col.type}
                          </span>
                          {col.note && (
                            <span className="text-[10px] text-[var(--muted-foreground)]/50 truncate">
                              {col.note}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1">
              <SchemaERD />
            </ScrollArea>
          )}
        </>
      )}

      {/* SQL Docs tab */}
      {activeTab === "docs" && (
        <div className="flex-1 overflow-hidden">
          <SqlDocsPanel
            relevantSections={relevantDocs}
            allSections={SQL_DOCS}
          />
        </div>
      )}
    </div>
  );
}
