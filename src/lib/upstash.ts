import { Redis } from "@upstash/redis"

// Returns null when env vars are not configured (local dev fallback)
export const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()
