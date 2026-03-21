"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  ArrowLeft,
  Users,
  Activity,
  Zap,
  BarChart3,
  Flame,
  Plus,
  Trash2,
  KeyRound,
  Shield,
  Building2,
  Trophy,
  ScrollText,
  Server,
  Upload,
} from "lucide-react";
import type { Level } from "@/lib/exercises/types";
import AdminTeamsTab from "./AdminTeamsTab";
import AdminCustomDbsTab from "./AdminCustomDbsTab";
import AdminAnalyticsTab from "./AdminAnalyticsTab";
import AdminChallengesTab from "./AdminChallengesTab";
import AdminAuditTab from "./AdminAuditTab";
import AdminSystemTab from "./AdminSystemTab";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserStat {
  readonly userId: number;
  readonly username: string;
  readonly isAdmin: boolean;
  readonly theme: string;
  readonly createdAt: string;
  readonly exercisesCompleted: number;
  readonly totalXP: number;
  readonly level: Level;
  readonly currentStreak: number;
  readonly lastActive: string | null;
}

interface Summary {
  readonly totalUsers: number;
  readonly activeThisWeek: number;
  readonly totalExercisesCompleted: number;
  readonly avgXP: number;
  readonly totalTeams: number;
  readonly totalCustomThemes: number;
  readonly customThemesErrors: number;
}

type AdminTab = "users" | "teams" | "custom-dbs" | "analytics" | "challenges" | "audit" | "system";

const TABS: readonly { readonly id: AdminTab; readonly label: string; readonly icon: typeof Users }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "teams", label: "Teams", icon: Building2 },
  { id: "custom-dbs", label: "Custom DBs", icon: Database },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "system", label: "System", icon: Server },
];

interface Props {
  readonly username: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminDashboardClient({ username }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<readonly UserStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvUsers, setCsvUsers] = useState<readonly { readonly username: string; readonly password: string }[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    readonly created: number;
    readonly errors: readonly { readonly username: string; readonly error: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setUsers(data.users);
      setSummary(data.summary);
      setError(null);
    } catch {
      setError("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create user.");
        return;
      }
      setNewUsername("");
      setNewPassword("");
      setShowCreate(false);
      await fetchUsers();
    } catch {
      setCreateError("Network error.");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/admin/users/${resetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      if (res.ok) {
        setResetUserId(null);
        setResetPassword("");
      } else {
        const data = await res.json();
        setResetError(data.error ?? "Failed to reset password.");
      }
    } catch {
      setResetError("Network error.");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteUserId(null);
        await fetchUsers();
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to delete user.");
      }
    } catch {
      setDeleteError("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const start = /^username/i.test(lines[0] ?? "") ? 1 : 0;
      const parsed = lines.slice(start).map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return { username: parts[0] ?? "", password: parts[1] ?? "" };
      });
      setCsvUsers(parsed);
      setBulkResult(null);
      setBulkError(null);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    setBulkImporting(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: csvUsers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error ?? "Bulk import failed.");
        return;
      }
      setBulkResult({ created: data.created, errors: data.errors });
      await fetchUsers();
    } catch {
      setBulkError("Network error.");
    } finally {
      setBulkImporting(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
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
            Admin Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">
            {username}
          </span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            My Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Manage users, teams, databases, and view system analytics
            </p>
          </div>
          {activeTab === "users" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkImport(!showBulkImport);
                  setCsvUsers([]);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--accent)] transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(!showCreate)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--cta)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            </div>
          )}
        </div>

        {/* Create user form (users tab only) */}
        {activeTab === "users" && showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold mb-2">New User</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--cta)]"
                  placeholder="username"
                  minLength={3}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)] mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--cta)]"
                  placeholder="min 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>
            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-md bg-[var(--cta)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Bulk import panel (users tab only) */}
        {activeTab === "users" && showBulkImport && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold mb-2">Bulk Import Users</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Upload a CSV file with <code className="bg-[var(--background)] px-1 rounded">username,password</code> per line.
              First row is skipped if it starts with &quot;username&quot;. Max 100 users.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFile}
              className="block text-sm text-[var(--muted-foreground)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--accent)] file:text-[var(--foreground)] file:cursor-pointer"
            />

            {csvUsers.length > 0 && (
              <>
                <div className="max-h-40 overflow-y-auto border border-[var(--border)] rounded-md">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                        <th className="text-left px-3 py-1.5">Username</th>
                        <th className="text-left px-3 py-1.5">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvUsers.map((u, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                          <td className="px-3 py-1">{u.username}</td>
                          <td className="px-3 py-1 text-[var(--muted-foreground)]">
                            {"•".repeat(Math.min(u.password.length, 12))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={bulkImporting}
                    className="px-4 py-2 rounded-md bg-[var(--cta)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {bulkImporting ? "Importing..." : `Import ${csvUsers.length} Users`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkImport(false);
                      setCsvUsers([]);
                      setBulkResult(null);
                      setBulkError(null);
                    }}
                    className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {bulkError && (
              <p className="text-xs text-red-400">{bulkError}</p>
            )}

            {bulkResult && (
              <div className="space-y-2">
                <p className="text-xs text-emerald-400">
                  Successfully created {bulkResult.created} user{bulkResult.created !== 1 ? "s" : ""}.
                </p>
                {bulkResult.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-red-400 font-medium">
                      {bulkResult.errors.length} error{bulkResult.errors.length !== 1 ? "s" : ""}:
                    </p>
                    {bulkResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400 pl-2">
                        {err.username}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : (
          <>
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <SummaryCard
                  icon={<Users className="w-4 h-4 text-[var(--primary)]" />}
                  label="Total Users"
                  value={summary.totalUsers}
                />
                <SummaryCard
                  icon={<Activity className="w-4 h-4 text-emerald-400" />}
                  label="Active This Week"
                  value={summary.activeThisWeek}
                />
                <SummaryCard
                  icon={<BarChart3 className="w-4 h-4 text-[var(--cta)]" />}
                  label="Exercises Done"
                  value={summary.totalExercisesCompleted}
                />
                <SummaryCard
                  icon={<Zap className="w-4 h-4 text-amber-400" />}
                  label="Avg XP"
                  value={summary.avgXP}
                />
                <SummaryCard
                  icon={<Building2 className="w-4 h-4 text-blue-400" />}
                  label="Teams"
                  value={summary.totalTeams}
                />
                <SummaryCard
                  icon={<Database className="w-4 h-4 text-purple-400" />}
                  label="Custom DBs"
                  value={summary.totalCustomThemes}
                  subtitle={
                    summary.customThemesErrors > 0
                      ? `${summary.customThemesErrors} error${summary.customThemesErrors !== 1 ? "s" : ""}`
                      : undefined
                  }
                />
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? "border-[var(--cta)] text-[var(--foreground)]"
                        : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "users" && (
              <div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          User
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          Exercises
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          XP
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          Level
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          Streak
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          Last Active
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.userId}
                          className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent)]/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.isAdmin && (
                                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-[10px] text-[var(--muted-foreground)]">
                                  Joined{" "}
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {user.exercisesCompleted}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-amber-400 font-medium">
                              {user.totalXP}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs">
                            {user.level}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {user.currentStreak > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <Flame className="w-3 h-3 text-orange-400" />
                                {user.currentStreak}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">
                            {formatDate(user.lastActive)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!user.isAdmin && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetUserId(user.userId);
                                    setResetPassword("");
                                  }}
                                  className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                  title="Reset password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteUserId(user.userId)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "teams" && <AdminTeamsTab />}

            {activeTab === "custom-dbs" && <AdminCustomDbsTab />}

            {activeTab === "analytics" && <AdminAnalyticsTab />}

            {activeTab === "challenges" && <AdminChallengesTab />}

            {activeTab === "audit" && <AdminAuditTab />}

            {activeTab === "system" && <AdminSystemTab />}
          </>
        )}

        {/* Reset password modal */}
        {resetUserId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-sm space-y-4">
              <h3 className="text-sm font-semibold">Reset Password</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Set a new password for{" "}
                <strong>
                  {users.find((u) => u.userId === resetUserId)?.username}
                </strong>
              </p>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--cta)]"
                placeholder="New password (min 6 chars)"
                minLength={6}
              />
              {resetError && (
                <p className="text-xs text-red-400">{resetError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetting || resetPassword.length < 6}
                  className="px-4 py-2 rounded-md bg-[var(--cta)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? "Resetting..." : "Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetUserId(null);
                    setResetError(null);
                  }}
                  className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteUserId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-sm space-y-4">
              <h3 className="text-sm font-semibold text-red-400">
                Delete User
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Are you sure you want to delete{" "}
                <strong>
                  {users.find((u) => u.userId === deleteUserId)?.username}
                </strong>
                ? This will permanently remove all their progress, XP, and
                badges.
              </p>
              {deleteError && (
                <p className="text-xs text-red-400">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteUserId(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card sub-component
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: number;
  readonly subtitle?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-[10px] text-red-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
