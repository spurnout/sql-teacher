import { getCurrentUser, type SessionUser } from "./session";

/**
 * Returns the current user if they are an admin, null otherwise.
 * Use in admin API routes as a guard.
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}
