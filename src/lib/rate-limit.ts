import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./upstash"

// In-memory fallback used when Upstash is not configured (local dev / tests)
const store: Record<string, { count: number; resetAt: number }> = {}

function checkMemory(
  identifier: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  if (store[identifier] && store[identifier].resetAt < now) {
    delete store[identifier]
  }
  if (!store[identifier]) {
    store[identifier] = { count: 1, resetAt: now + windowMs }
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  store[identifier].count++
  return {
    allowed: store[identifier].count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - store[identifier].count),
  }
}

function msToUpstashDuration(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  if (ms % (3_600_000) === 0) return `${ms / 3_600_000} h`
  if (ms % 60_000 === 0) return `${ms / 60_000} m`
  if (ms % 1_000 === 0) return `${ms / 1_000} s`
  return `${ms} ms`
}

export async function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return checkMemory(identifier, maxAttempts, windowMs)

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxAttempts, msToUpstashDuration(windowMs)),
      prefix: "rl",
    })
    const { success, remaining } = await limiter.limit(identifier)
    return { allowed: success, remaining }
  } catch {
    // Fail open: if Redis is unreachable, fall back to in-memory
    return checkMemory(identifier, maxAttempts, windowMs)
  }
}

export async function resetRateLimit(identifier: string): Promise<void> {
  delete store[identifier]
  if (redis) {
    // Upstash sliding window stores two keys per prefix+identifier
    await redis.del(`rl:${identifier}`)
  }
}
