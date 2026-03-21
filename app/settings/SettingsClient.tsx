"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database,
  ArrowLeft,
  User,
  Lock,
  Palette,
  Trash2,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useColorMode } from "@/components/ThemeProvider";

interface ThemeOption {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

interface Props {
  readonly username: string;
  readonly isAdmin: boolean;
  readonly currentTheme: string;
  readonly themes: readonly ThemeOption[];
  readonly createdAt: string | null;
}

export default function SettingsClient({
  username,
  isAdmin,
  currentTheme,
  themes,
  createdAt,
}: Props) {
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();

  // Theme switching
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSuccess, setThemeSuccess] = useState(false);
  const [themeError, setThemeError] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleThemeSave = async () => {
    if (selectedTheme === currentTheme) return;
    setThemeSaving(true);
    setThemeError("");
    setThemeSuccess(false);
    try {
      const res = await fetch("/api/user/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme }),
      });
      const data = await res.json();
      if (!res.ok) {
        setThemeError(data.error ?? "Failed to save theme.");
      } else {
        setThemeSuccess(true);
        setTimeout(() => setThemeSuccess(false), 3000);
        router.refresh();
      }
    } catch {
      setThemeError("Network error. Please try again.");
    } finally {
      setThemeSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Failed to change password.");
      } else {
        setPwSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwSuccess(false), 3000);
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmUsername: deleteUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete account.");
      } else {
        router.push("/");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">
            SQL Teacher
          </span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">
            /
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Settings
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleColorMode}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
            aria-label={
              colorMode === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {colorMode === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your profile and preferences.
          </p>
        </div>

        {/* Profile Info */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--primary)]" />
            Profile
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">
                Username
              </span>
              <span className="text-sm font-medium">{username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">
                Role
              </span>
              <span
                className={`text-sm font-medium ${isAdmin ? "text-amber-400" : ""}`}
              >
                {isAdmin ? "Admin" : "Member"}
              </span>
            </div>
            {createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Member since
                </span>
                <span className="text-sm font-medium">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">
                Appearance
              </span>
              <button
                type="button"
                onClick={toggleColorMode}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline cursor-pointer"
              >
                {colorMode === "dark" ? (
                  <>
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5" /> Light
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Database Theme */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            Database Theme
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme.id)}
                className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedTheme === theme.id
                    ? "border-[var(--cta)] bg-[var(--cta)]/5"
                    : "border-[var(--border)] hover:border-[var(--muted-foreground)]/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{theme.icon}</span>
                  <span className="text-sm font-medium">{theme.name}</span>
                </div>
              </button>
            ))}
          </div>

          {themeError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-3">
              {themeError}
            </p>
          )}
          {themeSuccess && (
            <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-3 py-2 mb-3 flex items-center gap-1">
              <Check className="w-3 h-3" /> Theme updated!
            </p>
          )}

          <button
            type="button"
            onClick={handleThemeSave}
            disabled={themeSaving || selectedTheme === currentTheme}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {themeSaving ? "Saving..." : "Save Theme"}
          </button>
        </section>

        {/* Change Password */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>

            {pwError && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-3 py-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> Password changed successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        {!isAdmin && (
          <section className="bg-[var(--card)] border border-red-500/30 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-400">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            {!showDelete ? (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-red-400">
                  Type your username <strong>{username}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteUsername}
                  onChange={(e) => setDeleteUsername(e.target.value)}
                  placeholder={username}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-red-500/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {deleteError && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || deleteUsername !== username}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {deleting ? "Deleting..." : "Permanently Delete Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDelete(false);
                      setDeleteUsername("");
                      setDeleteError("");
                    }}
                    className="px-4 py-2 bg-[var(--accent)] text-sm font-medium rounded-lg hover:bg-[var(--accent)]/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Logout */}
        <div className="pb-8">
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {
                // Proceed to login page even if logout request fails —
                // cookie expiry handles cleanup server-side
              }
              router.push("/");
            }}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
