import crypto from "crypto";
import { getAdminPool } from "@/lib/db/pool";
import { cookies } from "next/headers";
import type { ThemeId } from "@/content/themes/types";

const COOKIE_NAME = "sql_teacher_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  readonly id: number;
  readonly username: string;
  readonly theme: ThemeId;
  readonly isAdmin: boolean;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const pool = getAdminPool();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO app_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
  return token;
}

export async function getSessionUser(
  token: string
): Promise<SessionUser | null> {
  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT u.id, u.username, u.theme, u.is_admin
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  if (!result.rows[0]) return null;
  return {
    id: result.rows[0].id,
    username: result.rows[0].username,
    theme: result.rows[0].theme as ThemeId,
    isAdmin: result.rows[0].is_admin as boolean,
  };
}

export async function deleteSession(token: string): Promise<void> {
  const pool = getAdminPool();
  await pool.query(`DELETE FROM app_sessions WHERE token = $1`, [token]);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export function setSessionCookie(token: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export { COOKIE_NAME };
