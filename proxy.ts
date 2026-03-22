import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sql_teacher_session";

/**
 * NOTE: This proxy only checks for cookie presence — it cannot verify
 * token validity or expiry (Edge runtime has no DB access). Full session
 * validation (expiry, revocation) is enforced in each route/page via
 * getCurrentUser(). This is a rough first filter, not a security boundary.
 */
export function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/learn/:path*", "/dashboard", "/capstone/:path*", "/team/:path*", "/sandbox", "/assessment/:path*", "/choose-theme", "/admin/:path*", "/settings", "/help", "/challenges/:path*", "/scenario/:path*"],
};
