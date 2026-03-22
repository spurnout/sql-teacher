import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrg, getUserOrgRole } from "@/lib/teams/queries";
import { convertSql, type SqlDialect } from "@/lib/themes/sql-converter";
import { generateSchemaRef } from "@/lib/themes/schema-parser";

const VALID_DIALECTS: ReadonlySet<string> = new Set([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
]);

const MAX_RAW_SQL_LENGTH = 100_000_000;

/** POST /api/custom-themes/convert — server-side SQL conversion */
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
      { error: "Only owners and managers can convert SQL" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { rawSql, dialect } = body;

  if (typeof rawSql !== "string" || rawSql.trim().length === 0) {
    return NextResponse.json({ error: "rawSql is required" }, { status: 400 });
  }

  if (rawSql.length > MAX_RAW_SQL_LENGTH) {
    return NextResponse.json(
      { error: `Raw SQL exceeds maximum length (${MAX_RAW_SQL_LENGTH} chars)` },
      { status: 400 }
    );
  }

  if (typeof dialect !== "string" || !VALID_DIALECTS.has(dialect)) {
    return NextResponse.json(
      { error: "Invalid dialect. Must be: postgresql, mysql, sqlite, or sqlserver" },
      { status: 400 }
    );
  }

  const result = convertSql(rawSql, dialect as SqlDialect);
  const schemaRef = generateSchemaRef(result.ddl);

  return NextResponse.json({
    dialect: result.dialect,
    ddl: result.ddl,
    seed: result.seed,
    warnings: result.warnings,
    schemaRef,
  });
}
