"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Database,
  Crown,
} from "lucide-react";

interface TeamSummary {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: number;
  readonly ownerUsername: string;
  readonly createdAt: string;
  readonly memberCount: number;
  readonly customThemeCount: number;
}

interface TeamMember {
  readonly id: number;
  readonly userId: number;
  readonly username: string;
  readonly role: string;
  readonly joinedAt: string;
}

interface TeamInvite {
  readonly id: number;
  readonly code: string;
  readonly role: string;
  readonly expiresAt: string;
  readonly usedBy: number | null;
}

interface TeamDetail {
  readonly team: {
    readonly id: number;
    readonly name: string;
    readonly slug: string;
    readonly ownerId: number;
    readonly ownerUsername: string;
    readonly createdAt: string;
  };
  readonly members: readonly TeamMember[];
  readonly invites: readonly TeamInvite[];
}

export default function AdminTeamsTab() {
  const [teams, setTeams] = useState<readonly TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded team detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTeams(data.teams ?? []);
      setError(null);
    } catch {
      setError("Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const toggleExpand = async (teamId: number) => {
    if (expandedId === teamId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(teamId);
    setDetailLoading(true);
    setDetail(null);

    try {
      const res = await fetch(`/api/admin/teams/${teamId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/teams/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        if (expandedId === deleteId) {
          setExpandedId(null);
          setDetail(null);
        }
        await fetchTeams();
      } else {
        const data = await res.json();
        setDeleteError(data.error ?? "Failed to delete team.");
      }
    } catch {
      setDeleteError("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400 py-4">{error}</p>;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No teams created yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide w-8" />
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Team
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Owner
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Members
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Custom DBs
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Created
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                isExpanded={expandedId === team.id}
                detail={expandedId === team.id ? detail : null}
                detailLoading={expandedId === team.id && detailLoading}
                onToggle={() => toggleExpand(team.id)}
                onDelete={() => setDeleteId(team.id)}
                formatDate={formatDate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-red-400">Delete Team</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Are you sure you want to delete{" "}
              <strong>
                {teams.find((t) => t.id === deleteId)?.name}
              </strong>
              ? This will remove all members, invites, and custom databases
              associated with this team.
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
                  setDeleteId(null);
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team row sub-component
// ---------------------------------------------------------------------------

function TeamRow({
  team,
  isExpanded,
  detail,
  detailLoading,
  onToggle,
  onDelete,
  formatDate,
}: {
  readonly team: TeamSummary;
  readonly isExpanded: boolean;
  readonly detail: TeamDetail | null;
  readonly detailLoading: boolean;
  readonly onToggle: () => void;
  readonly onDelete: () => void;
  readonly formatDate: (d: string) => string;
}) {
  return (
    <>
      <tr className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--accent)]/30 transition-colors">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="font-medium">{team.name}</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {team.slug}
            </p>
          </div>
        </td>
        <td className="px-4 py-3 text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-amber-400" />
            {team.ownerUsername}
          </div>
        </td>
        <td className="px-4 py-3 text-right font-medium">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-[var(--muted-foreground)]" />
            {team.memberCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right font-medium">
          <span className="inline-flex items-center gap-1">
            <Database className="w-3 h-3 text-[var(--muted-foreground)]" />
            {team.customThemeCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-xs text-[var(--muted-foreground)]">
          {formatDate(team.createdAt)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-colors cursor-pointer"
            title="Delete team"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-8 py-4 bg-[var(--accent)]/20">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading team details...
              </div>
            ) : detail ? (
              <div className="space-y-4">
                {/* Members */}
                <div>
                  <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Members ({detail.members.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{m.username}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            m.role === "owner"
                              ? "bg-amber-400/20 text-amber-400"
                              : m.role === "manager"
                                ? "bg-blue-400/20 text-blue-400"
                                : "bg-[var(--accent)] text-[var(--muted-foreground)]"
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Invites */}
                {detail.invites.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                      Active Invites ({detail.invites.filter((i) => !i.usedBy).length})
                    </h4>
                    <div className="space-y-1">
                      {detail.invites
                        .filter((i) => !i.usedBy)
                        .map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded px-3 py-2 text-xs"
                          >
                            <code className="text-[var(--muted-foreground)] font-mono">
                              {invite.code.slice(0, 8)}...
                            </code>
                            <span className="text-[var(--muted-foreground)]">
                              Role: {invite.role} · Expires:{" "}
                              {formatDate(invite.expiresAt)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)]">
                Failed to load team details.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
