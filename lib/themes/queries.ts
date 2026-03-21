/**
 * Custom theme database queries.
 */
import { getAdminPool } from "@/lib/db/pool";
import type { SchemaReference } from "@/content/schema/reference";

export interface CustomThemeRow {
  readonly id: number;
  readonly org_id: number;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly schema_ref: SchemaReference;
  readonly table_mapping: Record<string, string> | null;
  readonly status: "pending" | "provisioned" | "error";
  readonly error_message: string | null;
  readonly created_at: string;
}

/** Get all custom themes for an organization */
export async function getOrgCustomThemes(
  orgId: number
): Promise<readonly CustomThemeRow[]> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, org_id, slug, name, description, schema_ref, table_mapping,
            status, error_message, created_at
     FROM custom_themes WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId]
  );
  return result.rows as CustomThemeRow[];
}

/** Get a single custom theme by slug */
export async function getCustomThemeBySlug(
  slug: string
): Promise<CustomThemeRow | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, org_id, slug, name, description, schema_ref, table_mapping,
            status, error_message, created_at
     FROM custom_themes WHERE slug = $1`,
    [slug]
  );
  return (result.rows[0] as CustomThemeRow) ?? null;
}

/** Create a new custom theme record (status = 'pending') */
export async function createCustomTheme(params: {
  readonly orgId: number;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly schemaSql: string;
  readonly seedSql: string;
  readonly schemaRef: SchemaReference;
  readonly tableMapping: Record<string, string> | null;
}): Promise<CustomThemeRow> {
  const pool = getAdminPool();
  const result = await pool.query(
    `INSERT INTO custom_themes (org_id, slug, name, description, schema_sql, seed_sql, schema_ref, table_mapping)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, org_id, slug, name, description, schema_ref, table_mapping, status, error_message, created_at`,
    [
      params.orgId,
      params.slug,
      params.name,
      params.description,
      params.schemaSql,
      params.seedSql,
      JSON.stringify(params.schemaRef),
      params.tableMapping ? JSON.stringify(params.tableMapping) : null,
    ]
  );
  return result.rows[0] as CustomThemeRow;
}

/** Update custom theme status after provisioning attempt */
export async function updateCustomThemeStatus(
  id: number,
  status: "provisioned" | "error",
  errorMessage?: string
): Promise<void> {
  const pool = getAdminPool();
  await pool.query(
    `UPDATE custom_themes SET status = $1, error_message = $2 WHERE id = $3`,
    [status, errorMessage ?? null, id]
  );
}

/** Delete a custom theme */
export async function deleteCustomTheme(id: number): Promise<void> {
  const pool = getAdminPool();
  await pool.query(`DELETE FROM custom_themes WHERE id = $1`, [id]);
}

/** Check if a slug is available */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT 1 FROM custom_themes WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return result.rows.length === 0;
}
