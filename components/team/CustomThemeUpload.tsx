"use client";

import { useState, useCallback } from "react";
import { Database, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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

export default function CustomThemeUpload({ existingThemes }: Props) {
  const [themes, setThemes] = useState<readonly CustomTheme[]>(existingThemes);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemaSql, setSchemaSql] = useState("");
  const [seedSql, setSeedSql] = useState("");
  const [schemaRefJson, setSchemaRefJson] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);

      try {
        // Parse schema reference JSON
        let schemaRef;
        try {
          schemaRef = JSON.parse(schemaRefJson);
        } catch {
          setError("Invalid schema reference JSON");
          return;
        }

        const res = await fetch("/api/custom-themes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug.toLowerCase().replace(/\s+/g, "-"),
            name,
            description,
            schemaSql,
            seedSql,
            schemaRef,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to create theme");
          return;
        }

        setThemes((prev) => [data.theme, ...prev]);
        setSuccess(`Theme "${name}" created successfully!`);
        setIsOpen(false);
        // Reset form
        setSlug("");
        setName("");
        setDescription("");
        setSchemaSql("");
        setSeedSql("");
        setSchemaRefJson("");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [slug, name, description, schemaSql, seedSql, schemaRefJson]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--cta)]" />
          <h3 className="text-sm font-semibold">Custom Database Themes</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--cta)] text-white rounded-md hover:opacity-90 transition-opacity"
        >
          <Upload className="w-3.5 h-3.5" />
          New Theme
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
          <CheckCircle className="w-3.5 h-3.5" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
          <AlertCircle className="w-3.5 h-3.5" />
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

      {/* Upload form */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
        >
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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--cta)] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
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
