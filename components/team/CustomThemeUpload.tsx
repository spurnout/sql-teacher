"use client";

import { useState, useCallback, useRef } from "react";
import {
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  detectDialect,
  convertSql,
  type SqlDialect,
  type ConversionResult,
} from "@/lib/themes/sql-converter";
import { generateSchemaRef } from "@/lib/themes/schema-parser";
import {
  convertCsvFiles,
  detectCsvContent,
  type CsvFile,
  type CsvConversionResult,
} from "@/lib/themes/csv-converter";

interface CustomTheme {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: "pending" | "provisioned" | "error";
  readonly error_message: string | null;
  readonly created_at: string;
}

interface Props {
  readonly existingThemes: readonly CustomTheme[];
}

type InputMode = "upload" | "csv" | "manual";

const DIALECT_LABELS: Record<SqlDialect, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  sqlserver: "SQL Server",
};

const MAX_FILE_SIZE = 1_000_000_000; // 1GB

/** Files above this threshold skip client-side processing and upload directly
 *  to the server for conversion + provisioning (prevents browser crashes). */
const LARGE_FILE_THRESHOLD = 50_000_000; // 50MB

export default function CustomThemeUpload({ existingThemes }: Props) {
  const [themes, setThemes] = useState<readonly CustomTheme[]>(existingThemes);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>("upload");

  // Form fields (shared between upload and manual)
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemaSql, setSchemaSql] = useState("");
  const [seedSql, setSeedSql] = useState("");
  const [schemaRefJson, setSchemaRefJson] = useState("");

  // Upload-specific state
  const [rawSql, setRawSql] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>("postgresql");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Large file direct-upload state
  const [largeFile, setLargeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // CSV-specific state
  const [csvFiles, setCsvFiles] = useState<readonly CsvFile[]>([]);
  const [csvFileNames, setCsvFileNames] = useState<readonly string[]>([]);
  const [csvResult, setCsvResult] = useState<CsvConversionResult | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Preview section toggles
  const [showDdlPreview, setShowDdlPreview] = useState(true);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);

  const resetForm = useCallback(() => {
    setSlug("");
    setName("");
    setDescription("");
    setSchemaSql("");
    setSeedSql("");
    setSchemaRefJson("");
    setRawSql("");
    setFileName(null);
    setSelectedDialect("postgresql");
    setConversionResult(null);
    setShowPreview(false);
    setCsvFiles([]);
    setCsvFileNames([]);
    setCsvResult(null);
    setLargeFile(null);
    setIsUploading(false);
    setUploadProgress(null);
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // File handling
  // -----------------------------------------------------------------------

  const handleFile = useCallback((file: File) => {
    setError(null);
    setConversionResult(null);
    setShowPreview(false);
    setLargeFile(null);
    setUploadProgress(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "sql") {
      setError(
        `Unsupported file type ".${ext ?? "unknown"}". ` +
          `Please upload a .sql file (database backup/dump). ` +
          `For CSV files, use the "CSV Files" tab.`
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large (${(file.size / 1_000_000).toFixed(1)}MB). ` +
          `Maximum supported size is ${MAX_FILE_SIZE / 1_000_000_000}GB. ` +
          `Try removing comments or non-essential data from the dump.`
      );
      return;
    }
    if (file.size === 0) {
      setError("The file is empty. Please select a file containing SQL statements.");
      return;
    }

    // Auto-populate name/slug from filename
    const baseName = file.name.replace(/\.sql$/i, "");
    setName((prev) => prev || baseName.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    setSlug((prev) => prev || baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    setFileName(file.name);

    // Large files: skip client-side processing entirely to avoid crashing the browser.
    // Dialect detection uses only the first 8KB read as a small slice.
    if (file.size > LARGE_FILE_THRESHOLD) {
      setLargeFile(file);
      // Read just the first 8KB for dialect detection (safe for any file size)
      const slice = file.slice(0, 8192);
      const peekReader = new FileReader();
      peekReader.onload = (e) => {
        const head = e.target?.result as string;
        if (looksLikeBinary(head)) {
          setError(
            "This file appears to be a binary file, not a text-based SQL dump. " +
              "Please export your database as a plain-text .sql file."
          );
          setLargeFile(null);
          setFileName(null);
          return;
        }
        const detection = detectDialect(head);
        setSelectedDialect(detection.dialect);
      };
      peekReader.readAsText(slice);
      return;
    }

    // Normal-sized files: read fully client-side
    const reader = new FileReader();
    reader.onerror = () => {
      setError("Could not read the file. Please try again or check the file is not corrupted.");
    };
    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (looksLikeBinary(content)) {
        setError(
          "This file appears to be a binary file, not a text-based SQL dump. " +
            "Please export your database as a plain-text .sql file (not a binary backup format)."
        );
        return;
      }

      const csvCheck = detectCsvContent(content);
      if (csvCheck.isCsv && csvCheck.confidence > 0.7) {
        setError(
          'This .sql file looks like CSV data, not SQL statements. ' +
            'Switch to the "CSV Files" tab to import CSV files.'
        );
        return;
      }

      setRawSql(content);

      const detection = detectDialect(content);
      setSelectedDialect(detection.dialect);
    };
    reader.readAsText(file);
  }, []);

  // -----------------------------------------------------------------------
  // CSV file handling
  // -----------------------------------------------------------------------

  const handleCsvFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    setCsvResult(null);
    setShowPreview(false);

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Limit number of files to prevent abuse
    if (fileArray.length > 20) {
      setError(
        `Too many files (${fileArray.length}). Maximum 20 CSV files per import. ` +
          `Each file becomes one table in the database.`
      );
      return;
    }

    // Validate all files
    const validExts = new Set(["csv", "tsv", "txt"]);
    const invalid = fileArray.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return !validExts.has(ext);
    });
    if (invalid.length > 0) {
      setError(
        `Unsupported file type(s): ${invalid.map((f) => `"${f.name}"`).join(", ")}. ` +
          `Please upload .csv, .tsv, or .txt files. ` +
          `Each file should contain data for one table (first row = column headers).`
      );
      return;
    }

    const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_FILE_SIZE * 2) {
      setError(
        `Total file size (${(totalSize / 1_000_000).toFixed(1)}MB) exceeds the ${(MAX_FILE_SIZE * 2) / 1_000_000}MB limit. ` +
          `Try reducing the number of rows or splitting into smaller files.`
      );
      return;
    }

    const emptyFiles = fileArray.filter((f) => f.size === 0);
    if (emptyFiles.length > 0) {
      setError(
        `Empty file(s): ${emptyFiles.map((f) => `"${f.name}"`).join(", ")}. ` +
          `Each CSV file must contain at least a header row.`
      );
      return;
    }

    // Read all files, aborting on first error
    let loaded = 0;
    let hadError = false;
    const results: CsvFile[] = [];
    const names: string[] = [];

    for (const file of fileArray) {
      const reader = new FileReader();
      reader.onerror = () => {
        if (hadError) return;
        hadError = true;
        setError(`Could not read "${file.name}". The file may be corrupted.`);
      };
      reader.onload = (e) => {
        if (hadError) return;
        const content = e.target?.result as string;

        if (looksLikeBinary(content)) {
          hadError = true;
          setError(
            `"${file.name}" appears to be a binary file, not text-based CSV. ` +
              `Please export your data as a plain-text CSV file.`
          );
          return;
        }

        results.push({ name: file.name, content });
        names.push(file.name);
        loaded++;

        if (loaded === fileArray.length) {
          setCsvFiles(results);
          setCsvFileNames(names);

          // Auto-populate name from first file
          if (results.length === 1) {
            const baseName = results[0].name.replace(/\.(csv|tsv|txt)$/i, "");
            setName((prev) =>
              prev || baseName.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            );
            setSlug((prev) =>
              prev || baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            );
          } else {
            setName((prev) => prev || `${results.length} Tables Import`);
            setSlug((prev) => prev || `import-${Date.now().toString(36)}`);
          }
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleCsvDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleCsvFiles(e.dataTransfer.files);
    },
    [handleCsvFiles]
  );

  const handleCsvInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleCsvFiles(e.target.files);
    },
    [handleCsvFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // -----------------------------------------------------------------------
  // Convert & Preview
  // -----------------------------------------------------------------------

  const handleConvert = useCallback(() => {
    setError(null);
    setConversionResult(null);

    if (inputMode === "csv") {
      // CSV conversion
      if (csvFiles.length === 0) {
        setError("No CSV files uploaded. Please add at least one CSV file.");
        return;
      }

      const result = convertCsvFiles(csvFiles);
      setCsvResult(result);

      if (!result.ddl.trim()) {
        const fileList = csvFiles.map((f) => `"${f.name}"`).join(", ");
        setError(
          `Could not extract any table structures from ${fileList}. ` +
            `Make sure each CSV file has a header row with column names, ` +
            `followed by data rows.`
        );
        return;
      }

      setSchemaSql(result.ddl);
      setSeedSql(result.seed);
      setSchemaRefJson(JSON.stringify(result.schemaRef, null, 2));
      setShowPreview(true);
      setShowDdlPreview(true);

      // Set conversion warnings as a ConversionResult-shaped object for warning display
      if (result.warnings.length > 0) {
        setConversionResult({
          dialect: "postgresql",
          ddl: result.ddl,
          seed: result.seed,
          warnings: result.warnings,
        });
      }
      return;
    }

    // SQL conversion
    if (!rawSql.trim()) {
      setError("No SQL content to convert. Please upload a .sql file first.");
      return;
    }

    const result = convertSql(rawSql, selectedDialect);
    setConversionResult(result);

    if (!result.ddl.trim() && !result.seed.trim()) {
      setError(
        "No CREATE TABLE or INSERT statements found in the file. " +
          "Make sure you're uploading a database dump that contains table definitions. " +
          "If the file uses a different dialect, try changing the dialect selector above."
      );
      return;
    }

    if (!result.ddl.trim()) {
      setError(
        "No CREATE TABLE statements found (only INSERT data). " +
          "The database schema (table definitions) is required. " +
          "Try exporting both schema and data from your database tool."
      );
      return;
    }

    setSchemaSql(result.ddl);
    setSeedSql(result.seed);

    const schemaRef = generateSchemaRef(result.ddl);
    setSchemaRefJson(JSON.stringify(schemaRef, null, 2));

    if (schemaRef.tables.length === 0) {
      setError(
        "Could not parse any table definitions from the converted DDL. " +
          "The schema reference will be empty, which may cause issues. " +
          "Try a different dialect or edit the DDL preview manually."
      );
      // Still show the preview so the user can inspect/edit the DDL
    }

    setShowPreview(true);
    setShowDdlPreview(true);
  }, [rawSql, selectedDialect, inputMode, csvFiles]);

  // -----------------------------------------------------------------------
  // Large file direct upload (server-side conversion + provisioning)
  // -----------------------------------------------------------------------

  const handleLargeFileUpload = useCallback(() => {
    if (!largeFile) return;
    setError(null);
    setSuccess(null);
    setIsUploading(true);
    setUploadProgress("Preparing upload...");

    const formData = new FormData();
    formData.append("file", largeFile);
    formData.append("slug", slug.toLowerCase().replace(/\s+/g, "-"));
    formData.append("name", name);
    formData.append("description", description);
    formData.append("dialect", selectedDialect);

    const sizeMB = (largeFile.size / 1_000_000).toFixed(0);

    // Use XMLHttpRequest for real upload progress tracking
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        const loadedMB = (e.loaded / 1_000_000).toFixed(1);
        // Show 1 decimal for <10%, integer for ≥10%
        const pctStr = pct < 10 ? pct.toFixed(1) : Math.round(pct).toString();
        setUploadProgress(
          `Uploading: ${loadedMB}MB / ${sizeMB}MB (${pctStr}%)`
        );
      }
    });

    xhr.upload.addEventListener("load", () => {
      setUploadProgress(
        "Upload complete. Server is converting and provisioning — this may take a minute..."
      );
    });

    xhr.addEventListener("load", () => {
      setIsUploading(false);
      setUploadProgress(null);

      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        setError(
          `Server returned status ${xhr.status} with no parseable response. ` +
            `The file may be too large to process. Try splitting it into smaller parts.`
        );
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        setError(data.error ?? `Server error (${xhr.status}). Please try again.`);
        return;
      }

      setThemes((prev) => [data.theme, ...prev]);
      const warningNote =
        data.warnings?.length > 0
          ? ` (${data.warnings.length} conversion warning${data.warnings.length > 1 ? "s" : ""})`
          : "";
      setSuccess(
        `Theme "${name}" created and provisioned successfully!${warningNote} ` +
          `It is now available for exercises.`
      );
      setIsOpen(false);
      resetForm();
    });

    xhr.addEventListener("error", () => {
      xhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(null);
      setError(
        "Upload failed — the connection was lost or the server is not reachable. " +
          "Make sure the server is running and try again."
      );
    });

    xhr.addEventListener("timeout", () => {
      xhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(null);
      setError(
        "Upload timed out after 10 minutes. The file may be too large for the current server configuration."
      );
    });

    xhr.addEventListener("abort", () => {
      xhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(null);
    });

    xhr.addEventListener("loadend", () => {
      // Always clean up ref when request finishes for any reason
      xhrRef.current = null;
    });

    xhrRef.current = xhr;
    xhr.open("POST", "/api/custom-themes/upload");
    xhr.timeout = 600_000; // 10 minute timeout for very large files
    xhr.send(formData);
  }, [largeFile, slug, name, description, selectedDialect, resetForm]);

  const handleCancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(null);
    setError(null);
  }, []);

  // -----------------------------------------------------------------------
  // Submit (normal / small file flow)
  // -----------------------------------------------------------------------

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);

      try {
        let schemaRef;
        try {
          schemaRef = JSON.parse(schemaRefJson);
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : "";
          setError(
            `Invalid schema reference JSON${msg ? `: ${msg}` : ""}. ` +
              `If you edited the JSON preview, check for syntax errors (missing commas, brackets, etc.).`
          );
          return;
        }

        if (!schemaRef?.tables || !Array.isArray(schemaRef.tables) || schemaRef.tables.length === 0) {
          setError(
            "Schema reference must contain at least one table. " +
              "Click 'Convert & Preview' again to regenerate it from the DDL."
          );
          return;
        }

        const body: Record<string, unknown> = {
          slug: slug.toLowerCase().replace(/\s+/g, "-"),
          name,
          description,
          schemaSql,
          seedSql,
          schemaRef,
        };

        // Include source dialect and raw SQL for server-side validation
        if (inputMode === "upload" && rawSql && selectedDialect !== "postgresql") {
          body.sourceDialect = selectedDialect;
          body.rawSql = rawSql;
        }

        // Mark CSV-sourced themes
        if (inputMode === "csv") {
          body.sourceDialect = "csv";
        }

        const res = await fetch("/api/custom-themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          setError(
            `Server returned status ${res.status} with no details. ` +
              `This may be a temporary server issue. Please try again.`
          );
          return;
        }

        if (!res.ok) {
          setError(data.error ?? `Server error (${res.status}). Please try again.`);
          return;
        }

        setThemes((prev) => [data.theme, ...prev]);
        setSuccess(`Theme "${name}" created and provisioned successfully! It is now available for exercises.`);
        setIsOpen(false);
        resetForm();
      } catch (networkErr) {
        const detail = networkErr instanceof Error ? networkErr.message : "";
        setError(
          `Network error${detail ? `: ${detail}` : ""}. ` +
            `Check your internet connection and try again.`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [slug, name, description, schemaSql, seedSql, schemaRefJson, inputMode, rawSql, selectedDialect, resetForm]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--cta)]" />
          <h3 className="text-sm font-semibold">Custom Databases</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) resetForm();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--cta)] text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Database
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Existing themes list */}
      {themes.length > 0 && (
        <div className="space-y-2">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="flex items-center justify-between px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md"
            >
              <div>
                <span className="text-sm font-medium">{theme.name}</span>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  custom-{theme.slug}
                </span>
              </div>
              <StatusBadge status={theme.status} error={theme.error_message} />
            </div>
          ))}
        </div>
      )}

      {/* Upload/Manual form */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
        >
          {/* Input mode tabs */}
          <div className="flex gap-1 p-0.5 bg-[var(--background)] rounded-md w-fit">
            {(["upload", "csv", "manual"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode)}
                className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                  inputMode === mode
                    ? "bg-[var(--accent)] text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {mode === "upload" ? "SQL File" : mode === "csv" ? "CSV Files" : "Manual Input"}
              </button>
            ))}
          </div>

          {/* Name / Slug row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                Theme Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Company DB"
                required
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                Slug (URL-safe identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-company-db"
                required
                pattern="[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]"
                className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Our e-commerce database with products, customers, and orders"
              className="w-full px-2.5 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md"
            />
          </div>

          {/* ---- UPLOAD MODE ---- */}
          {inputMode === "upload" && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[var(--cta)] bg-[var(--cta)]/5"
                    : fileName
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <FileUp
                  className={`w-6 h-6 ${
                    fileName ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                  }`}
                />
                {fileName ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-400">{fileName}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Drop .sql file here or click to browse
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                      Supports PostgreSQL, MySQL, SQLite, SQL Server dumps (max 1GB)
                    </p>
                  </div>
                )}
              </div>

              {/* Dialect selector (shown after file upload or large file selected) */}
              {(rawSql || largeFile) && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    SQL Dialect (auto-detected, override if needed)
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(DIALECT_LABELS) as SqlDialect[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedDialect(d);
                          setShowPreview(false);
                          setConversionResult(null);
                          setSchemaSql("");
                          setSeedSql("");
                          setSchemaRefJson("");
                        }}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                          selectedDialect === d
                            ? "border-[var(--cta)] bg-[var(--cta)]/10 text-[var(--cta)] font-medium"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {DIALECT_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Large file: direct upload flow (no client-side preview) */}
              {largeFile && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-xs text-blue-400 font-medium mb-1">
                      Large file ({(largeFile.size / 1_000_000).toFixed(0)}MB) — server-side processing
                    </p>
                    <p className="text-[10px] text-blue-400/80">
                      Files over 50MB are uploaded directly to the server for conversion and
                      provisioning. No browser-side preview is available for files this large.
                    </p>
                  </div>

                  {uploadProgress && (
                    <div className="p-3 bg-[var(--cta)]/5 border border-[var(--cta)]/20 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--cta)]" />
                          <span className="text-xs font-medium text-[var(--foreground)]">
                            {uploadProgress}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelUpload}
                          className="px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 border border-red-400/30 rounded transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        Do not close this page. Large files may take several minutes to upload and process.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLargeFileUpload}
                    disabled={isUploading || !slug.trim() || !name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[var(--cta)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {isUploading ? "Uploading & Processing..." : "Upload & Create Theme"}
                  </button>
                </div>
              )}

              {/* Normal file: Convert button */}
              {rawSql && !largeFile && !showPreview && (
                <button
                  type="button"
                  onClick={handleConvert}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Convert & Preview
                </button>
              )}

              {/* Conversion warnings */}
              {conversionResult && conversionResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      Conversion Warnings ({conversionResult.warnings.length})
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {conversionResult.warnings.slice(0, 10).map((w, i) => (
                      <li key={i} className="text-[10px] text-amber-400/80">
                        {w}
                      </li>
                    ))}
                    {conversionResult.warnings.length > 10 && (
                      <li className="text-[10px] text-amber-400/60">
                        ...and {conversionResult.warnings.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview panels (collapsible, editable) */}
              {showPreview && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Preview converted output. You can edit before submitting.
                  </p>

                  {/* DDL Preview */}
                  <CollapsibleSection
                    title="Converted DDL (CREATE TABLE)"
                    isOpen={showDdlPreview}
                    onToggle={() => setShowDdlPreview(!showDdlPreview)}
                    count={schemaSql.split(/CREATE\s+TABLE/gi).length - 1}
                  >
                    <textarea
                      value={schemaSql}
                      onChange={(e) => setSchemaSql(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>

                  {/* Seed Preview */}
                  <CollapsibleSection
                    title="Seed Data (INSERT)"
                    isOpen={showSeedPreview}
                    onToggle={() => setShowSeedPreview(!showSeedPreview)}
                    count={seedSql.split(/INSERT\s+INTO/gi).length - 1}
                  >
                    <textarea
                      value={seedSql}
                      onChange={(e) => setSeedSql(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>

                  {/* Schema Reference Preview */}
                  <CollapsibleSection
                    title="Schema Reference (JSON)"
                    isOpen={showSchemaPreview}
                    onToggle={() => setShowSchemaPreview(!showSchemaPreview)}
                  >
                    <textarea
                      value={schemaRefJson}
                      onChange={(e) => setSchemaRefJson(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>
                </div>
              )}
            </>
          )}

          {/* ---- CSV MODE ---- */}
          {inputMode === "csv" && (
            <>
              {/* CSV drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleCsvDrop}
                onClick={() => csvInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[var(--cta)] bg-[var(--cta)]/5"
                    : csvFileNames.length > 0
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                }`}
              >
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  multiple
                  onChange={handleCsvInput}
                  className="hidden"
                />
                <FileUp
                  className={`w-6 h-6 ${
                    csvFileNames.length > 0 ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                  }`}
                />
                {csvFileNames.length > 0 ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-400">
                      {csvFileNames.length} file{csvFileNames.length > 1 ? "s" : ""} loaded
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {csvFileNames.join(", ")}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Drop CSV files here or click to browse
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                      Each file = one table. First row = column headers. (max 400KB total)
                    </p>
                  </div>
                )}
              </div>

              {/* CSV table summary */}
              {csvResult && csvResult.tables.length > 0 && (
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
                  <p className="text-xs font-medium mb-1.5">Detected Tables</p>
                  <div className="space-y-1">
                    {csvResult.tables.map((t) => (
                      <div
                        key={t.tableName}
                        className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]"
                      >
                        <span className="font-mono">{t.tableName}</span>
                        <span>
                          {t.columns} columns, {t.rows} rows
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convert button */}
              {csvFiles.length > 0 && !showPreview && (
                <button
                  type="button"
                  onClick={handleConvert}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[var(--primary)] text-white rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Convert & Preview
                </button>
              )}

              {/* Conversion warnings (reuses same display as SQL mode) */}
              {conversionResult && conversionResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      Conversion Notes ({conversionResult.warnings.length})
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {conversionResult.warnings.slice(0, 10).map((w, i) => (
                      <li key={i} className="text-[10px] text-amber-400/80">
                        {w}
                      </li>
                    ))}
                    {conversionResult.warnings.length > 10 && (
                      <li className="text-[10px] text-amber-400/60">
                        ...and {conversionResult.warnings.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview panels (same as SQL mode) */}
              {showPreview && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Preview generated SQL. You can edit before submitting.
                  </p>
                  <CollapsibleSection
                    title="Generated DDL (CREATE TABLE)"
                    isOpen={showDdlPreview}
                    onToggle={() => setShowDdlPreview(!showDdlPreview)}
                    count={schemaSql.split(/CREATE\s+TABLE/gi).length - 1}
                  >
                    <textarea
                      value={schemaSql}
                      onChange={(e) => setSchemaSql(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Seed Data (INSERT)"
                    isOpen={showSeedPreview}
                    onToggle={() => setShowSeedPreview(!showSeedPreview)}
                    count={seedSql.split(/INSERT\s+INTO/gi).length - 1}
                  >
                    <textarea
                      value={seedSql}
                      onChange={(e) => setSeedSql(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Schema Reference (JSON)"
                    isOpen={showSchemaPreview}
                    onToggle={() => setShowSchemaPreview(!showSchemaPreview)}
                  >
                    <textarea
                      value={schemaRefJson}
                      onChange={(e) => setSchemaRefJson(e.target.value)}
                      rows={8}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                    />
                  </CollapsibleSection>
                </div>
              )}
            </>
          )}

          {/* ---- MANUAL MODE ---- */}
          {inputMode === "manual" && (
            <>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                  Schema SQL (CREATE TABLE statements)
                </label>
                <textarea
                  value={schemaSql}
                  onChange={(e) => setSchemaSql(e.target.value)}
                  placeholder={`CREATE TABLE customers (\n  id SERIAL PRIMARY KEY,\n  name TEXT NOT NULL,\n  ...\n);`}
                  required
                  rows={6}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                  Seed SQL (INSERT statements)
                </label>
                <textarea
                  value={seedSql}
                  onChange={(e) => setSeedSql(e.target.value)}
                  placeholder={`INSERT INTO customers (id, name, ...) VALUES\n(1, 'Alice', ...),\n(2, 'Bob', ...);`}
                  required
                  rows={6}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                  Schema Reference (JSON)
                </label>
                <textarea
                  value={schemaRefJson}
                  onChange={(e) => setSchemaRefJson(e.target.value)}
                  placeholder={`{\n  "tables": [\n    {\n      "name": "customers",\n      "columns": [\n        { "name": "id", "type": "serial", "note": "PK" }\n      ]\n    }\n  ]\n}`}
                  required
                  rows={6}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md resize-y"
                />
              </div>
            </>
          )}

          {/* Submit / Cancel */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !schemaSql.trim() ||
                (inputMode === "manual" && !seedSql.trim()) ||
                !schemaRefJson.trim() ||
                ((inputMode === "upload" || inputMode === "csv") && !showPreview)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--cta)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Create & Provision
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Binary content detection helper
// ---------------------------------------------------------------------------

/** Quick check: if a significant portion of the first 1KB contains control
 *  characters (NUL, non-printable), treat it as binary. */
function looksLikeBinary(content: string): boolean {
  const sample = content.slice(0, 1024);
  let controlCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    // NUL, or other non-printable chars excluding common whitespace
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      controlCount++;
    }
  }
  return controlCount > sample.length * 0.05; // >5% control chars → binary
}

// ---------------------------------------------------------------------------
// Collapsible section sub-component
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  count,
  children,
}: {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly count?: number;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--border)] rounded-md overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--background)] transition-colors cursor-pointer"
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
            {count} {count === 1 ? "statement" : "statements"}
          </span>
        )}
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge sub-component
// ---------------------------------------------------------------------------

function StatusBadge({
  status,
  error,
}: {
  readonly status: string;
  readonly error: string | null;
}) {
  switch (status) {
    case "provisioned":
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    case "error":
      return (
        <span
          className="flex items-center gap-1 text-xs text-red-400"
          title={error ?? "Unknown error"}
        >
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Pending
        </span>
      );
  }
}
