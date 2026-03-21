import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import {
  getOrgCustomThemes,
  createCustomTheme,
  updateCustomThemeStatus,
  isSlugAvailable,
} from "@/lib/themes/queries";
import {
  provisionCustomTheme,
  deprovisionCustomTheme,
} from "@/lib/themes/provisioner";
import type { SchemaReference } from "@/content/schema/reference";

const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/;

/** GET /api/custom-themes — list custom themes for user's org */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getUserOrg(user.id);
  if (!org) {
    return NextResponse.json({ themes: [] });
  }

  const themes = await getOrgCustomThemes(org.id);
  return NextResponse.json({ themes });
}

/** POST /api/custom-themes — create and provision a new custom theme */
export async function POST(req: NextRequest) {
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
      { error: "Only owners and managers can create custom themes" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { slug, name, description, schemaSql, seedSql, schemaRef, tableMapping } =
    body;

  // Validate inputs
  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: "Invalid slug. Use lowercase letters, numbers, and hyphens (3-50 chars)." },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return NextResponse.json({ error: "Name is required (max 200 chars)" }, { status: 400 });
  }

  if (typeof schemaSql !== "string" || schemaSql.trim().length === 0 || schemaSql.length > 100_000) {
    return NextResponse.json(
      { error: "Schema SQL is required (max 100KB)" },
      { status: 400 }
    );
  }

  if (typeof seedSql !== "string" || seedSql.trim().length === 0 || seedSql.length > 100_000) {
    return NextResponse.json(
      { error: "Seed SQL is required (max 100KB)" },
      { status: 400 }
    );
  }

  if (
    !schemaRef ||
    typeof schemaRef !== "object" ||
    !("tables" in schemaRef) ||
    !Array.isArray((schemaRef as Record<string, unknown>).tables)
  ) {
    return NextResponse.json(
      { error: "Schema reference with tables array is required" },
      { status: 400 }
    );
  }

  // Validate tableMapping shape if provided
  const validatedTableMapping: Record<string, string> | null =
    tableMapping && typeof tableMapping === "object" && !Array.isArray(tableMapping)
      ? (tableMapping as Record<string, string>)
      : null;

  // Check slug availability
  const available = await isSlugAvailable(slug);
  if (!available) {
    return NextResponse.json(
      { error: "This slug is already in use" },
      { status: 409 }
    );
  }

  // Create the theme record
  const theme = await createCustomTheme({
    orgId: org.id,
    slug,
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    schemaSql,
    seedSql,
    schemaRef: schemaRef as SchemaReference,
    tableMapping: validatedTableMapping,
  });

  // Attempt provisioning
  const result = await provisionCustomTheme(slug, schemaSql, seedSql);

  if (result.success) {
    await updateCustomThemeStatus(theme.id, "provisioned");
    return NextResponse.json({
      theme: { ...theme, status: "provisioned" as const },
    });
  } else {
    await deprovisionCustomTheme(slug);
    await updateCustomThemeStatus(theme.id, "error", result.error);
    return NextResponse.json(
      {
        error: `Provisioning failed: ${result.error}`,
        theme: {
          ...theme,
          status: "error" as const,
          error_message: result.error,
        },
      },
      { status: 422 }
    );
  }
}
