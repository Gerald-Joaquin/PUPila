/**
 * Lightweight in-memory rate limiter.
 * Works on a single Next.js server instance — suitable for demo/hackathon use.
 *
 * Usage:
 *   const result = rateLimit(ip, { limit: 10, windowMs: 60_000 })
 *   if (!result.allowed) return Response.json({ error: "Too many requests" }, { status: 429 })
 */

interface Entry {
  count:     number
  resetAt:   number
}

const store = new Map<string, Entry>()

interface RateLimitOptions {
  /** Max requests allowed per window */
  limit:    number
  /** Window size in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    number
}

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)
  return {
    allowed:   entry.count <= limit,
    remaining,
    resetAt:   entry.resetAt
  }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
