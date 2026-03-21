import crypto from "crypto";
import { getAdminPool } from "@/lib/db/pool";
import type { Organization, OrgMember, OrgInvite, OrgRole } from "./types";

/** Get the organization a user belongs to (if any) */
export async function getUserOrg(
  userId: number
): Promise<Organization | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at
     FROM organizations o
     JOIN org_members m ON m.org_id = o.id
     WHERE m.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as number,
    name: row.name as string,
    slug: row.slug as string,
    ownerId: row.owner_id as number,
    createdAt: row.created_at as string,
  };
}

/** Get a user's role within their organization */
export async function getUserOrgRole(
  userId: number,
  orgId: number
): Promise<OrgRole | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT role FROM org_members WHERE user_id = $1 AND org_id = $2`,
    [userId, orgId]
  );
  return (result.rows[0]?.role as OrgRole) ?? null;
}

/** Create a new organization and add the creator as owner.
 *  Uses a transaction to prevent race conditions where two concurrent
 *  requests could both create an org for the same user. The unique index
 *  idx_org_members_one_per_user enforces one-org-per-user at the DB level. */
export async function createOrg(
  userId: number,
  name: string,
  slug: string
): Promise<Organization> {
  const pool = getAdminPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create org
    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, owner_id, created_at`,
      [name, slug, userId]
    );

    const org = orgResult.rows[0];

    // Add creator as owner — the unique index on org_members(user_id)
    // will reject this if the user already belongs to any org.
    await client.query(
      `INSERT INTO org_members (user_id, org_id, role)
       VALUES ($1, $2, 'owner')`,
      [userId, org.id]
    );

    await client.query("COMMIT");

    return {
      id: org.id as number,
      name: org.name as string,
      slug: org.slug as string,
      ownerId: org.owner_id as number,
      createdAt: org.created_at as string,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    // Translate constraint violations into user-friendly errors
    if (
      err instanceof Error &&
      "code" in err
    ) {
      const code = (err as Record<string, unknown>).code;
      if (code === "23505") {
        // Could be duplicate slug or duplicate user membership
        if (err.message.includes("idx_org_members_one_per_user") || err.message.includes("org_members")) {
          throw new Error("User already belongs to an organization");
        }
        throw new Error("Team slug is already taken");
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

/** List all members of an organization */
export async function getOrgMembers(orgId: number): Promise<readonly OrgMember[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT m.id, m.user_id, u.username, m.role, m.joined_at
     FROM org_members m
     JOIN app_users u ON u.id = m.user_id
     WHERE m.org_id = $1
     ORDER BY m.joined_at`,
    [orgId]
  );

  return result.rows.map((r) => ({
    id: r.id as number,
    userId: r.user_id as number,
    username: r.username as string,
    role: r.role as OrgRole,
    joinedAt: r.joined_at as string,
  }));
}

/** Generate an invite code for an organization */
export async function createInvite(
  orgId: number,
  role: OrgRole = "member",
  expiresInDays: number = 7
): Promise<OrgInvite> {
  const pool = getAdminPool();
  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  );

  const result = await pool.query(
    `INSERT INTO org_invites (org_id, code, role, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, code, role, expires_at, used_by`,
    [orgId, code, role, expiresAt]
  );

  const row = result.rows[0];
  return {
    id: row.id as number,
    code: row.code as string,
    role: row.role as OrgRole,
    expiresAt: row.expires_at as string,
    usedBy: null,
  };
}

/** Accept an invite code and join the organization */
export async function acceptInvite(
  userId: number,
  code: string
): Promise<{ org: Organization; role: OrgRole }> {
  const pool = getAdminPool();

  // Check if user already belongs to an org
  const existing = await getUserOrg(userId);
  if (existing) {
    throw new Error("User already belongs to an organization");
  }

  // Atomically claim the invite (prevents two users accepting the same invite)
  const inviteResult = await pool.query(
    `UPDATE org_invites i
     SET used_by = $1
     FROM organizations o
     WHERE o.id = i.org_id
       AND i.code = $2
       AND i.expires_at > NOW()
       AND i.used_by IS NULL
     RETURNING i.id, i.org_id, i.role, o.id AS oid, o.name, o.slug, o.owner_id, o.created_at`,
    [userId, code]
  );

  if (inviteResult.rows.length === 0) {
    throw new Error("Invalid or expired invite code");
  }

  const row = inviteResult.rows[0];
  const orgId = row.org_id as number;
  const role = row.role as OrgRole;

  // Add user to org
  await pool.query(
    `INSERT INTO org_members (user_id, org_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, org_id) DO NOTHING`,
    [userId, orgId, role]
  );

  return {
    org: {
      id: row.oid as number,
      name: row.name as string,
      slug: row.slug as string,
      ownerId: row.owner_id as number,
      createdAt: row.created_at as string,
    },
    role,
  };
}

/** Remove a member from an organization */
export async function removeMember(
  orgId: number,
  userId: number
): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `DELETE FROM org_members WHERE org_id = $1 AND user_id = $2 AND role != 'owner'`,
    [orgId, userId]
  );
}

/** List active invites for an organization */
export async function getOrgInvites(
  orgId: number
): Promise<readonly OrgInvite[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, code, role, expires_at, used_by
     FROM org_invites
     WHERE org_id = $1 AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [orgId]
  );

  return result.rows.map((r) => ({
    id: r.id as number,
    code: r.code as string,
    role: r.role as OrgRole,
    expiresAt: r.expires_at as string,
    usedBy: (r.used_by as number) ?? null,
  }));
}
