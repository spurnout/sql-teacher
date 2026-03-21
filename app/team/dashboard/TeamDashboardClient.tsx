"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  ArrowLeft,
  Users,
  Activity,
  BarChart3,
  Zap,
  TrendingUp,
  Flame,
} from "lucide-react";
import type { Level } from "@/lib/exercises/types";
import TeamAnalytics from "./TeamAnalytics";

interface MemberStat {
  readonly userId: number;
  readonly username: string;
  readonly role: string;
  readonly currentPhase: string;
  readonly exercisesCompleted: number;
  readonly totalXP: number;
  readonly level: Level;
  readonly streak: number;
  readonly lastActive: string | null;
}

interface TeamStats {
  readonly totalMembers: number;
  readonly activeThisWeek: number;
  readonly avgCompletionPct: number;
  readonly avgXP: number;
  readonly members: readonly MemberStat[];
}

interface Props {
  readonly username: string;
  readonly orgName: string;
}

export default function TeamDashboardClient({ username, orgName }: Props) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPhase = (phaseId: string) =>
    phaseId.replace("phase-", "Phase ").replace(/\b\d/, (d) => d);

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
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Team Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
          <Link
            href="/team"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Team Settings
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{orgName} — Team Progress</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Monitor your team&apos;s SQL learning progress
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted-foreground)]">Loading team stats...</div>
        ) : !stats ? (
          <div className="text-sm text-red-400">Failed to load team data.</div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[var(--primary)]" />
                  <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                    Members
                  </p>
                </div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                    Active This Week
                  </p>
                </div>
                <p className="text-2xl font-bold">{stats.activeThisWeek}</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[var(--cta)]" />
                  <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                    Avg Completion
                  </p>
                </div>
                <p className="text-2xl font-bold">{stats.avgCompletionPct}%</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                    Avg XP
                  </p>
                </div>
                <p className="text-2xl font-bold">{stats.avgXP}</p>
              </div>
            </div>

            {/* Member table */}
            <div>
              <h2 className="text-base font-semibold mb-4">Team Members</h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        Member
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        Current Phase
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                        Completed
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
                    </tr>
                  </thead>
                  <tbody>
                    {stats.members.map((member) => (
                      <tr
                        key={member.userId}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent)]/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{member.username}</p>
                          <p className="text-xs text-[var(--muted-foreground)] capitalize">
                            {member.role}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <TrendingUp className="w-3 h-3 text-[var(--primary)]" />
                            {formatPhase(member.currentPhase)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {member.exercisesCompleted}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-amber-400 font-medium">
                            {member.totalXP}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          {member.level}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {member.streak > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Flame className="w-3 h-3 text-orange-400" />
                              {member.streak}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">
                          {formatDate(member.lastActive)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Team Analytics Section */}
        <TeamAnalytics />
      </main>
    </div>
  );
}
