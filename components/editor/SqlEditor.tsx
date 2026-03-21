"use client";

import dynamic from "next/dynamic";
import { useRef, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] flex items-center justify-center bg-[var(--background)] text-[var(--muted-foreground)] text-sm font-mono">
      Loading editor...
    </div>
  ),
});

interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onRun: () => void;
  readonly isRunning: boolean;
  readonly showCharCount?: boolean;
}

const MONACO_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  language: "sql",
  theme: "vs-dark",
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  minimap: { enabled: false },
  lineNumbers: "on",
  wordWrap: "on",
  automaticLayout: true,
  tabSize: 2,
  bracketPairColorization: { enabled: true },
  scrollBeyondLastLine: false,
  padding: { top: 8, bottom: 8 },
};

export default function SqlEditor({
  value,
  onChange,
  onRun,
  isRunning,
  showCharCount = false,
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
      // Cmd/Ctrl+Enter to run query
      editorInstance.addCommand(2048 | 3, () => {
        onRun();
      });
    },
    [onRun]
  );

  return (
    <div className="flex flex-col border-b border-[var(--border)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--card)] border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--muted-foreground)] tracking-wide uppercase">
          SQL Editor
        </span>
        <div className="flex items-center gap-2">
          {showCharCount && (
            <span className="text-xs font-mono text-amber-400 font-medium">
              {value.trim().length} chars
            </span>
          )}
          <span className="text-xs text-[var(--muted-foreground)]/60 hidden sm:block">
            Ctrl+Enter to run
          </span>
          <button
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta)]/60 disabled:pointer-events-none disabled:opacity-50 cursor-pointer bg-[var(--cta)] text-[var(--cta-foreground)] hover:brightness-105 active:brightness-95"
            onClick={onRun}
            disabled={isRunning}
            aria-label={isRunning ? "Running query..." : "Run query"}
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isRunning ? "Running..." : "Run Query"}
          </button>
        </div>
      </div>

      <MonacoEditor
        height="280px"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleEditorMount}
        options={MONACO_OPTIONS}
      />
    </div>
  );
}
