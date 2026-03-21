"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  BookOpen,
  Trophy,
  Award,
  Zap,
  Shield,
} from "lucide-react";

type Mode = "login" | "register";

const PHASES = [
  { title: "SQL Fundamentals", desc: "SELECT, WHERE, ORDER BY, aggregations" },
  { title: "JOIN Mastery", desc: "INNER, LEFT, RIGHT, FULL, CROSS joins" },
  { title: "Subqueries", desc: "Correlated, EXISTS, IN, scalar subqueries" },
  { title: "CTEs", desc: "WITH clauses, recursive CTEs" },
  { title: "Window Functions", desc: "ROW_NUMBER, RANK, LAG, LEAD, frames" },
  { title: "Query Optimization", desc: "EXPLAIN ANALYZE, indexes, performance" },
  { title: "SQL Patterns", desc: "CASE, COALESCE, UNION, JSONB, date/string" },
  { title: "DML & DDL", desc: "CREATE, INSERT, UPDATE, DELETE, constraints" },
  { title: "DB Administration", desc: "Indexes, views, transactions, VACUUM" },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        // New users go to theme picker; returning users go to dashboard
        const redirect = mode === "register" ? "/choose-theme" : "/dashboard";
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-8 h-8 text-[var(--cta)]" />
            <span className="text-3xl font-bold tracking-tight">
              SQL Teacher
            </span>
          </div>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
            Master PostgreSQL from scratch. 90+ exercises, 4 capstone projects,
            and a certificate of completion. Everything you need for a junior DBA
            role.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <BookOpen className="w-5 h-5 text-[var(--primary)] mx-auto mb-2" />
            <p className="text-2xl font-bold">9</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Learning Phases
            </p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Capstone Projects
            </p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">XP</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Levels & Streaks
            </p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <Award className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Certificate
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Curriculum overview */}
          <div>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--primary)]" />
              Curriculum
            </h2>
            <div className="space-y-2">
              {PHASES.map((phase, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2.5"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-[var(--muted-foreground)] mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{phase.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {phase.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 font-medium">
                + 4 Capstone Projects
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Sales Dashboard, User Retention, DB Health, Data Quality — solve
                real-world challenges to earn your certificate.
              </p>
            </div>
          </div>

          {/* Auth form */}
          <div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 sticky top-8">
              <h2 className="text-base font-semibold mb-4 text-center">
                Get Started
              </h2>

              {/* Tab switcher */}
              <div className="flex mb-6 bg-[var(--accent)] rounded-md p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                    mode === "login"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer ${
                    mode === "register"
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    required
                    autoComplete={
                      mode === "login" ? "username" : "new-password"
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === "register"
                        ? "At least 6 characters"
                        : "••••••••"
                    }
                    required
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)] focus:border-transparent text-sm"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-[var(--cta)] text-[var(--cta-foreground)] font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              {mode === "register" && (
                <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
                  Username and password only — no email required.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">
            SQL Teacher — Learn PostgreSQL hands-on with a real database.
            Exercises run against a live PostgreSQL 16 instance.
          </p>
        </div>
      </div>
    </div>
  );
}
