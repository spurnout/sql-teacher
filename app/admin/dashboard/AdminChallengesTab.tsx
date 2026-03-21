"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, Trophy, Calendar, Loader2, Flame } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeedRunAnalytics {
  readonly phaseId: string;
  readonly totalSessions: number;
  readonly completedSessions: number;
  readonly completionRate: number;
  readonly avgElapsedMs: number | null;
  readonly bestElapsedMs: number | null;
  readonly avgExercisesCompleted: number;
}

interface GolfAnalytics {
  readonly exerciseId: string;
  readonly exerciseTitle: string;
  readonly totalRecords: number;
  readonly avgCharCount: number;
  readonly bestCharCount: number;
  readonly uniquePlayers: number;
}

interface DailyChallengeAnalytics {
  readonly totalChallenges: number;
  readonly completedChallenges: number;
  readonly completionRate: number;
  readonly uniqueParticipants: number;
  readonly streakLeaders: readonly {
    readonly username: string;
    readonly consecutiveDays: number;
  }[];
}

interface ChallengeData {
  readonly speedRuns: readonly SpeedRunAnalytics[];
  readonly golfRecords: readonly GolfAnalytics[];
  readonly dailyChallenges: DailyChallengeAnalytics;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

// ---------------------------------------------------------------------------
// SummaryCard sub-component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-[var(--foreground)]">{value}</div>
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminChallengesTab() {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/challenges");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json as ChallengeData);
      setError(null);
    } catch {
      setError("Failed to load challenge analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading challenge analytics…
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-16 text-red-400">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Speed Runs */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Timer className="w-4 h-4 text-[var(--cta)]" />
          Speed Runs
        </h3>

        {data.speedRuns.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No speed run sessions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">Phase</th>
                  <th className="py-2 pr-3 font-medium text-right">Sessions</th>
                  <th className="py-2 pr-3 font-medium text-right">Completed</th>
                  <th className="py-2 pr-3 font-medium text-right">Completion Rate</th>
                  <th className="py-2 pr-3 font-medium text-right">Avg Time</th>
                  <th className="py-2 pr-3 font-medium text-right">Best Time</th>
                  <th className="py-2 font-medium text-right">Avg Exercises</th>
                </tr>
              </thead>
              <tbody>
                {data.speedRuns.map((sr) => (
                  <tr
                    key={sr.phaseId}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[var(--foreground)]">{sr.phaseId}</td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {sr.totalSessions}
                    </td>
                    <td className="py-2 pr-3 text-right text-emerald-400">
                      {sr.completedSessions}
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {sr.completionRate}%
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--muted-foreground)]">
                      {formatMs(sr.avgElapsedMs)}
                    </td>
                    <td className="py-2 pr-3 text-right text-amber-400 font-medium">
                      {formatMs(sr.bestElapsedMs)}
                    </td>
                    <td className="py-2 text-right text-[var(--foreground)]">
                      {sr.avgExercisesCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SQL Golf Leaderboard */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          SQL Golf Leaderboard
        </h3>

        {data.golfRecords.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No golf records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium">Exercise</th>
                  <th className="py-2 pr-3 font-medium text-right">Players</th>
                  <th className="py-2 pr-3 font-medium text-right">Avg Chars</th>
                  <th className="py-2 pr-3 font-medium text-right">Best Chars</th>
                  <th className="py-2 font-medium text-right">Records</th>
                </tr>
              </thead>
              <tbody>
                {data.golfRecords.map((gr) => (
                  <tr
                    key={gr.exerciseId}
                    className="border-b border-[var(--border)] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[var(--foreground)]">{gr.exerciseTitle}</td>
                    <td className="py-2 pr-3 text-right text-[var(--foreground)]">
                      {gr.uniquePlayers}
                    </td>
                    <td className="py-2 pr-3 text-right text-[var(--muted-foreground)]">
                      {gr.avgCharCount}
                    </td>
                    <td className="py-2 pr-3 text-right text-emerald-400 font-medium">
                      {gr.bestCharCount}
                    </td>
                    <td className="py-2 text-right text-[var(--foreground)]">
                      {gr.totalRecords}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Daily Challenges */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Daily Challenges
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Assigned" value={data.dailyChallenges.totalChallenges} />
          <StatCard label="Completed" value={data.dailyChallenges.completedChallenges} />
          <StatCard label="Completion Rate" value={`${data.dailyChallenges.completionRate}%`} />
          <StatCard label="Participants" value={data.dailyChallenges.uniqueParticipants} />
        </div>

        {data.dailyChallenges.streakLeaders.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] mb-3 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Top Streak Leaders
            </h4>
            <div className="space-y-2">
              {data.dailyChallenges.streakLeaders.map((leader, i) => (
                <div
                  key={leader.username}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--foreground)]">
                    <span className="text-[var(--muted-foreground)] mr-2">#{i + 1}</span>
                    {leader.username}
                  </span>
                  <span className="text-amber-400 font-medium">
                    {leader.consecutiveDays} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
