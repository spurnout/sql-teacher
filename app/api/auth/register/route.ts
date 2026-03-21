import { NextRequest, NextResponse } from "next/server";
import { getAdminPool } from "@/lib/db/pool";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import {
  checkRateLimit,
  getRateLimitKey,
  REGISTER_LIMIT,
} from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per hour per IP
  const rlKey = getRateLimitKey(req, "register");
  const rl = checkRateLimit(rlKey, REGISTER_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
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

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }
  if (username.length < 3 || username.length > 32) {
    return NextResponse.json(
      { error: "Username must be 3–32 characters." },
      { status: 400 }
    );
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 6–128 characters." },
      { status: 400 }
    );
  }

  const pool = getAdminPool();
  const passwordHash = await hashPassword(password);

  // Atomic: is_admin = TRUE only if no other users exist at INSERT time.
  // The INSERT uses ON CONFLICT to handle race conditions where two
  // registrations with the same username arrive simultaneously.
  let result;
  try {
    result = await pool.query(
      `INSERT INTO app_users (username, password_hash, is_admin)
       SELECT $1, $2, (NOT EXISTS (SELECT 1 FROM app_users))
       RETURNING id, is_admin`,
      [username.toLowerCase(), passwordHash]
    );
  } catch (err: unknown) {
    // Handle unique constraint violation (concurrent duplicate username)
    if (err instanceof Error && "code" in err && (err as Record<string, unknown>).code === "23505") {
      return NextResponse.json(
        { error: "Username already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }

  const userId = result.rows[0].id;
  const isFirstUser = result.rows[0].is_admin as boolean;

  const token = await createSession(userId);
  const cookieProps = setSessionCookie(token);

  const response = NextResponse.json({
    username: username.toLowerCase(),
    isAdmin: isFirstUser,
  });
  response.cookies.set(cookieProps);
  return response;
}
