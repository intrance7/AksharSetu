/**
 * Hybrid Redis + In-Memory TTL Cache for AksharSetu.
 *
 * - When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` / `KV_REST_API_TOKEN`)
 *   are configured, reads/writes transparently use Upstash Redis REST with zero native driver overhead,
 *   fronted by a short L1 in-memory cache for sub-millisecond repeated SSR hits.
 * - When running locally without Redis credentials, falls back seamlessly to the process-wide L1 TTL
 *   cache with in-flight request deduplication so concurrent SSR loads never stampede Postgres.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const g = globalThis as unknown as {
  __aksharCacheL1?: Map<string, CacheEntry<unknown>>
  __aksharCacheInflight?: Map<string, Promise<unknown>>
}

const l1Store = (g.__aksharCacheL1 ??= new Map<string, CacheEntry<unknown>>())
const inflight = (g.__aksharCacheInflight ??= new Map<string, Promise<unknown>>())

const REDIS_URL = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  ""
).replace(/\/+$/, "")
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ""

export const isRedisConfigured = Boolean(REDIS_URL && REDIS_TOKEN)

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/

function jsonDateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return value
}

async function redisGet<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured) return null
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { result?: string | null }
    if (!data?.result) return null
    return JSON.parse(data.result, jsonDateReviver) as T
  } catch {
    return null
  }
}

async function redisSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!isRedisConfigured) return
  try {
    await fetch(
      `${REDIS_URL}/set/${encodeURIComponent(key)}?EX=${Math.max(1, Math.round(ttlSeconds))}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REDIS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(JSON.stringify(value)),
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      }
    )
  } catch {
    // Non-fatal: L1 still serves warm hits
  }
}

async function redisDel(key: string): Promise<void> {
  if (!isRedisConfigured) return
  try {
    await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    })
  } catch {}
}

/**
 * Fetch from L1 -> Redis -> loader(), with in-flight deduplication and automatic TTL eviction.
 */
export async function cachedQuery<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const hit = l1Store.get(key)
  if (hit && hit.expiresAt > now) {
    return hit.value as T
  }

  const pending = inflight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const work = (async () => {
    try {
      // Check Redis L2 if configured
      if (isRedisConfigured) {
        const remote = await redisGet<T>(key)
        if (remote !== null) {
          l1Store.set(key, { value: remote, expiresAt: Date.now() + Math.min(ttlMs, 15_000) })
          return remote
        }
      }

      const fresh = await loader()
      const exp = Date.now() + ttlMs
      if (l1Store.size > 400) {
        const firstKey = l1Store.keys().next().value
        if (firstKey) l1Store.delete(firstKey)
      }
      l1Store.set(key, { value: fresh, expiresAt: exp })
      if (isRedisConfigured) {
        void redisSet(key, fresh, Math.ceil(ttlMs / 1000))
      }
      return fresh
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, work)
  return work
}

export function invalidateCacheKey(key: string) {
  l1Store.delete(key)
  void redisDel(key)
}

export function invalidateCachePrefix(prefix: string) {
  for (const k of l1Store.keys()) {
    if (k.startsWith(prefix)) {
      l1Store.delete(k)
      void redisDel(k)
    }
  }
}
