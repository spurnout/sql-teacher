import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllBuiltinThemes } from "@/content/themes";
import { getAdminPool } from "@/lib/db/pool";

export const runtime = "nodejs";

interface SchemaItem {
  readonly id: string;
  readonly name: string;
  readonly dbSchema: string;
  readonly type: "builtin" | "custom";
}

/**
 * GET /api/admin/schemas
 *
 * Returns all available theme schemas (builtin + provisioned custom themes).
 * Admin-only — used by the SQL Studio schema switcher dropdown.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const schemas: SchemaItem[] = [];

  // Builtin themes
  for (const theme of getAllBuiltinThemes()) {
    schemas.push({
      id: theme.id,
      name: theme.name,
      dbSchema: theme.dbSchema,
      type: "builtin",
    });
  }

  // Custom themes (provisioned only)
  const pool = getAdminPool();
  const result = await pool.query<{
    slug: string;
    name: string;
  }>(
    `SELECT slug, name FROM custom_themes
     WHERE status = 'provisioned'
     ORDER BY name`
  );

  for (const row of result.rows) {
    schemas.push({
      id: `custom-${row.slug}`,
      name: row.name,
      dbSchema: `theme_custom_${row.slug.replace(/-/g, "_")}`,
      type: "custom",
    });
  }

  return NextResponse.json({ schemas });
}
