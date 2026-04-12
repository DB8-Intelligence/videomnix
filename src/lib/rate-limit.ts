/**
 * Rate limiter simples in-memory para API routes.
 * Em produção com múltiplas instâncias Vercel, considerar usar Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas a cada 60s
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 60_000)

interface RateLimitOptions {
  /** Máximo de requests por janela */
  limit: number
  /** Janela em segundos */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + options.windowSeconds * 1000
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  entry.count++
  const remaining = Math.max(0, options.limit - entry.count)
  const allowed = entry.count <= options.limit

  return { allowed, remaining, resetAt: entry.resetAt }
}

/**
 * Helper para usar em API routes:
 *
 * const { allowed, remaining } = rateLimit(userId, { limit: 5, windowSeconds: 60 })
 * if (!allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 * }
 */
export function rateLimitByUser(userId: string, endpoint: string) {
  return rateLimit(`${userId}:${endpoint}`, { limit: 10, windowSeconds: 60 })
}

export function rateLimitByIp(ip: string, endpoint: string) {
  return rateLimit(`ip:${ip}:${endpoint}`, { limit: 30, windowSeconds: 60 })
}
