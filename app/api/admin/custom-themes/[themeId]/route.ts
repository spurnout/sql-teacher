import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCustomThemeWithSql } from "@/lib/admin/queries";
import { deleteCustomTheme, updateCustomThemeStatus } from "@/lib/themes/queries";
import { deprovisionCustomTheme, provisionCustomTheme } from "@/lib/themes/provisioner";
import { logAuditEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";

/**
 * DELETE — Delete a custom theme and deprovision its PG schema.
 * Deletes the DB record first, then cleans up the PG schema.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { themeId } = await params;
  const id = parseInt(themeId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid theme ID." }, { status: 400 });
  }

  try {
    const theme = await getCustomThemeWithSql(id);
    if (!theme) {
      return NextResponse.json({ error: "Theme not found." }, { status: 404 });
    }

    const wasProvisioned = theme.status === "provisioned";
    const slug = theme.slug;

    // Delete DB record first (safe ordering — if schema cleanup fails,
    // the record is already gone and orphaned schema can be reconciled later)
    await deleteCustomTheme(id);

    // Clean up the PG schema after record deletion
    if (wasProvisioned) {
      try {
        await deprovisionCustomTheme(slug);
      } catch {
        // Schema cleanup failure is non-fatal
      }
    }

    logAuditEvent({
      adminId: admin.id,
      action: "theme.delete",
      targetType: "custom-theme",
      targetId: String(id),
      details: { slug },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete custom theme." },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Retry provisioning for a theme in error or pending status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { themeId } = await params;
  const id = parseInt(themeId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid theme ID." }, { status: 400 });
  }

  try {
    const theme = await getCustomThemeWithSql(id);
    if (!theme) {
      return NextResponse.json({ error: "Theme not found." }, { status: 404 });
    }

    if (theme.status === "provisioned") {
      return NextResponse.json(
        { error: "Theme is already provisioned." },
        { status: 400 }
      );
    }

    // Only drop schema for error status (pending themes likely have no schema)
    if (theme.status === "error") {
      try {
        await deprovisionCustomTheme(theme.slug);
      } catch {
        // Non-fatal — schema may not exist
      }
    }

    // Retry provisioning
    const result = await provisionCustomTheme(
      theme.slug,
      theme.schemaSql,
      theme.seedSql
    );

    if (result.success) {
      await updateCustomThemeStatus(id, "provisioned");

      logAuditEvent({
        adminId: admin.id,
        action: "theme.retry",
        targetType: "custom-theme",
        targetId: String(id),
        details: { slug: theme.slug, result: "provisioned" },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      }).catch(() => {});

      return NextResponse.json({ success: true, status: "provisioned" });
    } else {
      await updateCustomThemeStatus(id, "error", result.error);

      logAuditEvent({
        adminId: admin.id,
        action: "theme.retry",
        targetType: "custom-theme",
        targetId: String(id),
        details: { slug: theme.slug, result: "error", error: result.error },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: result.error ?? "Provisioning failed." },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to retry provisioning." },
      { status: 500 }
    );
  }
}
