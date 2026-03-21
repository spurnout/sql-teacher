import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { deleteOrganization } from "@/lib/admin/queries";
import { getOrgMembers, getOrgInvites } from "@/lib/teams/queries";
import { getAdminPool } from "@/lib/db/pool";
import { logAuditEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";

/**
 * GET — Get team details including members and invites.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teamId } = await params;
  const orgId = parseInt(teamId, 10);
  if (Number.isNaN(orgId)) {
    return NextResponse.json({ error: "Invalid team ID." }, { status: 400 });
  }

  try {
    const pool = getAdminPool();
    const orgResult = await pool.query(
      `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at, u.username AS owner_username
       FROM organizations o
       JOIN app_users u ON u.id = o.owner_id
       WHERE o.id = $1`,
      [orgId]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    const row = orgResult.rows[0];
    const team = {
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      ownerId: row.owner_id as number,
      ownerUsername: row.owner_username as string,
      createdAt: (row.created_at as Date).toISOString(),
    };

    const [members, invites] = await Promise.all([
      getOrgMembers(orgId),
      getOrgInvites(orgId),
    ]);

    return NextResponse.json({ team, members, invites });
  } catch {
    return NextResponse.json(
      { error: "Failed to load team details." },
      { status: 500 }
    );
  }
}

/**
 * DELETE — Delete a team and all its associated data.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teamId } = await params;
  const orgId = parseInt(teamId, 10);
  if (Number.isNaN(orgId)) {
    return NextResponse.json({ error: "Invalid team ID." }, { status: 400 });
  }

  try {
    // Look up team name before deletion for audit logging
    const pool = getAdminPool();
    const teamLookup = await pool.query(
      `SELECT name, slug FROM organizations WHERE id = $1`,
      [orgId]
    );
    const teamName = (teamLookup.rows[0]?.name as string) ?? "unknown";
    const teamSlug = (teamLookup.rows[0]?.slug as string) ?? "unknown";

    const deleted = await deleteOrganization(orgId);
    if (!deleted) {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }

    logAuditEvent({
      adminId: admin.id,
      action: "team.delete",
      targetType: "team",
      targetId: String(orgId),
      details: { name: teamName, slug: teamSlug },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete team." },
      { status: 500 }
    );
  }
}
