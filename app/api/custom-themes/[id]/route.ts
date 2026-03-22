import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import { deleteCustomTheme } from "@/lib/themes/queries";
import { deprovisionCustomTheme } from "@/lib/themes/provisioner";
import { getAdminPool } from "@/lib/db/pool";

/** DELETE /api/custom-themes/[id] — delete a custom theme and drop its schema */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json(
      { error: "You must be part of an organization" },
      { status: 403 }
    );
  }

  const role = await getUserOrgRole(user.id, org.id);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json(
      { error: "Only owners and managers can delete custom themes" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const themeId = parseInt(id, 10);
  if (isNaN(themeId) || themeId <= 0) {
    return NextResponse.json({ error: "Invalid theme ID" }, { status: 400 });
  }

  // Verify the theme belongs to this org
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, slug, org_id FROM custom_themes WHERE id = $1`,
    [themeId]
  );
  const theme = result.rows[0] as
    | { id: number; slug: string; org_id: number }
    | undefined;

  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  if (theme.org_id !== org.id) {
    return NextResponse.json(
      { error: "This theme does not belong to your organization" },
      { status: 403 }
    );
  }

  // Drop the PostgreSQL schema (if it was provisioned)
  try {
    await deprovisionCustomTheme(theme.slug);
  } catch (err) {
    // Non-fatal: schema may not exist if provisioning failed
    console.warn(
      `[delete-theme] Failed to deprovision schema for "${theme.slug}":`,
      err instanceof Error ? err.message : err
    );
  }

  // Delete the record
  await deleteCustomTheme(themeId);

  return NextResponse.json({ success: true });
}
