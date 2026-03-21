import { NextRequest, NextResponse } from "next/server";
import { getAdminPool } from "@/lib/db/pool";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import {
  checkRateLimit,
  getRateLimitKey,
  LOGIN_LIMIT,
} from "@/lib/auth/rate-limit";
import { cleanupExpiredSessions } from "@/lib/auth/session-cleanup";

export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per 15 minutes per IP
  const rlKey = getRateLimitKey(req, "login");
  const rl = checkRateLimit(rlKey, LOGIN_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { username, password } = body;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const pool = getAdminPool();
  const result = await pool.query(
    `SELECT id, password_hash FROM app_users WHERE username = $1`,
    [username.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const token = await createSession(user.id);
  const cookieProps = setSessionCookie(token);

  // M4: Opportunistically clean up expired sessions (fire-and-forget)
  cleanupExpiredSessions().catch(() => {});

  const response = NextResponse.json({ username: username.toLowerCase() });
  response.cookies.set(cookieProps);
  return response;
}
