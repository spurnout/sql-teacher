/**
 * In-memory sliding-window rate limiter for auth endpoints.
 *
 * Keyed by IP address. Tracks timestamps of recent requests and rejects
 * when the count exceeds the limit within the window.
 *
 * Limitations:
 * - Not shared across multiple server instances (use Redis for multi-process).
 * - Memory grows with distinct IPs; stale entries are pruned on each check.
 */

interface RateLimitEntry {
  readonly timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/** Prune entries older than the window */
function pruneEntry(entry: RateLimitEntry, windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return entry.timestamps.filter((t) => t > cutoff);
}

/** Periodically clear stale keys to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let cleanupScheduled = false;

function scheduleCleanup(windowMs: number): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of store) {
      const recent = entry.timestamps.filter((t) => t > cutoff);
      if (recent.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS).unref();
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  readonly maxRequests: number;
  /** Time window in milliseconds */
  readonly windowMs: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number | null;
}

/**
 * Check and consume a rate limit token for the given key.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  scheduleCleanup(config.windowMs);

  const existing = store.get(key);
  const timestamps = existing
    ? pruneEntry(existing, config.windowMs)
    : [];

  if (timestamps.length >= config.maxRequests) {
    // Calculate when the earliest request will expire
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - Date.now();
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  timestamps.push(Date.now());
  store.set(key, { timestamps });

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    retryAfterMs: null,
  };
}

// ---------------------------------------------------------------------------
// Preconfigured limiters for auth endpoints
// ---------------------------------------------------------------------------

/** Login: 10 attempts per 15 minutes per IP */
export const LOGIN_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
};

/** Registration: 5 accounts per hour per IP */
export const REGISTER_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
};

/**
 * Extract a rate-limit key from a Next.js request.
 * Uses x-forwarded-for (reverse proxy) or falls back to a static key.
 */
export function getRateLimitKey(
  req: { headers: { get(name: string): string | null } },
  prefix: string
): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}
