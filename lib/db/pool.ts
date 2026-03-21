import { Pool } from "pg";

let sandboxPool: Pool | null = null;
let adminPool: Pool | null = null;

export function getSandboxPool(): Pool {
  if (!sandboxPool) {
    sandboxPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return sandboxPool;
}

export function getAdminPool(): Pool {
  if (!adminPool) {
    adminPool = new Pool({
      connectionString: process.env.DATABASE_ADMIN_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return adminPool;
}
