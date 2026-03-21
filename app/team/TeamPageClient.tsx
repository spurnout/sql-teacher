"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database,
  ArrowLeft,
  Users,
  Plus,
  Copy,
  Check,
  UserMinus,
  Link as LinkIcon,
  Shield,
  User,
  Crown,
} from "lucide-react";
import type { OrgRole } from "@/lib/teams/types";
import CustomThemeUpload from "@/components/team/CustomThemeUpload";

interface OrgData {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: string;
}

interface MemberData {
  readonly id: number;
  readonly userId: number;
  readonly username: string;
  readonly role: OrgRole;
  readonly joinedAt: string;
}

interface InviteData {
  readonly id: number;
  readonly code: string;
  readonly role: OrgRole;
  readonly expiresAt: string;
  readonly usedBy: number | null;
}

interface CustomThemeData {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: "pending" | "provisioned" | "error";
  readonly error_message: string | null;
  readonly created_at: string;
}

interface Props {
  readonly username: string;
  readonly org: OrgData | null;
  readonly members: readonly MemberData[];
  readonly invites: readonly InviteData[];
  readonly role: OrgRole | null;
  readonly customThemes?: readonly CustomThemeData[];
}

function RoleIcon({ role }: { readonly role: OrgRole }) {
  switch (role) {
    case "owner":
      return <Crown className="w-3.5 h-3.5 text-amber-400" />;
    case "manager":
      return <Shield className="w-3.5 h-3.5 text-[var(--primary)]" />;
    default:
      return <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />;
  }
}

export default function TeamPageClient({
  username,
  org,
  members,
  invites,
  role,
  customThemes = [],
}: Props) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isManager = role === "owner" || role === "manager";

  const handleCreateTeam = useCallback(async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setCreating(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to create team");
      setCreating(false);
    }
  }, [teamName, router]);

  const handleJoinTeam = useCallback(async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch("/api/teams/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setJoining(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to join team");
      setJoining(false);
    }
  }, [inviteCode, router]);

  const handleGenerateInvite = useCallback(
    async (inviteRole: "member" | "manager") => {
      setGeneratingInvite(true);
      setError(null);
      try {
        const res = await fetch("/api/teams/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: inviteRole }),
        });
        if (res.ok) {
          router.refresh();
        } else {
          const data = await res.json();
          setError(data.error ?? "Failed to generate invite.");
        }
      } catch {
        setError("Failed to generate invite.");
      } finally {
        setGeneratingInvite(false);
      }
    },
    [router]
  );

  const handleCopyCode = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleRemoveMember = useCallback(
    async (userId: number) => {
      setRemovingUser(userId);
      setError(null);
      try {
        const res = await fetch("/api/teams/members", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          router.refresh();
        } else {
          const data = await res.json();
          setError(data.error ?? "Failed to remove member.");
        }
      } catch {
        setError("Failed to remove member.");
      } finally {
        setRemovingUser(null);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Team</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">{username}</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {!org ? (
          /* No team — create or join */
          <>
            <div>
              <h1 className="text-2xl font-bold mb-1">Team Management</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Create a new team or join an existing one with an invite code.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Create Team */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create a Team
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="flex-1 bg-[var(--accent)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={creating || !teamName.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>

            {/* Join Team */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Join a Team
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 bg-[var(--accent)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <button
                  onClick={handleJoinTeam}
                  disabled={joining || !inviteCode.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--cta)] text-white text-sm font-medium hover:bg-[var(--cta)]/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {joining ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Has team — show management UI */
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{org.name}</h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {members.length} member{members.length !== 1 ? "s" : ""} · Your role:{" "}
                  <span className="capitalize font-medium">{role}</span>
                </p>
              </div>
              {isManager && (
                <Link
                  href="/team/dashboard"
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  Team Dashboard
                </Link>
              )}
            </div>

            {/* Members */}
            <div>
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members
              </h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <RoleIcon role={member.role} />
                      <div>
                        <p className="text-sm font-medium">{member.username}</p>
                        <p className="text-xs text-[var(--muted-foreground)] capitalize">
                          {member.role} · joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {isManager && member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removingUser === member.userId}
                        className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Themes (managers/owners) */}
            {isManager && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
                <CustomThemeUpload existingThemes={customThemes} />
              </div>
            )}

            {/* Invites (managers/owners) */}
            {isManager && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Invite Links
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateInvite("member")}
                      disabled={generatingInvite}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--accent)]/80 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      + Member Invite
                    </button>
                    <button
                      onClick={() => handleGenerateInvite("manager")}
                      disabled={generatingInvite}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--accent)]/80 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      + Manager Invite
                    </button>
                  </div>
                </div>

                {invites.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    No active invites. Generate one above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-mono">{invite.code}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Role: <span className="capitalize">{invite.role}</span>
                            {" · "}
                            {invite.usedBy
                              ? "Used"
                              : `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        {!invite.usedBy && (
                          <button
                            onClick={() => handleCopyCode(invite.code)}
                            className="p-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === invite.code ? (
                              <Check className="w-4 h-4 text-[var(--cta)]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
