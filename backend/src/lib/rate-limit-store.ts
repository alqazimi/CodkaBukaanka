/**
 * Redis-ready rate limit store.
 * Set REDIS_URL to enable distributed rate limiting (optional dependency).
 * Falls back to in-memory store for single-instance dev.
 */
import { Redis } from "ioredis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  count: number;
};

export interface RateLimitStore {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  get(key: string): Promise<{ count: number; resetAt: number }>;
  reset(key: string): Promise<void>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  private pruneExpired(now = Date.now()): void {
    if (this.buckets.size < 500) return;
    for (const [key, entry] of this.buckets) {
      if (now > entry.resetAt) this.buckets.delete(key);
    }
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.pruneExpired(now);
    const entry = this.buckets.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { success: true, remaining: limit - 1, resetAt, count: 1 };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0, resetAt: entry.resetAt, count: entry.count };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt, count: entry.count };
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.buckets.get(key);
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }
    entry.count++;
    return { count: entry.count, resetAt: entry.resetAt };
  }

  async get(key: string): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const entry = this.buckets.get(key);
    if (!entry || now > entry.resetAt) return { count: 0, resetAt: now };
    return { count: entry.count, resetAt: entry.resetAt };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      enableReadyCheck: true,
    });
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const ttlKey = `rl:${key}`;
    try {
      const count = await this.redis.incr(ttlKey);
      if (count === 1) {
        await this.redis.pexpire(ttlKey, windowMs);
      }
      const ttl = Math.max(await this.redis.pttl(ttlKey), 0);
      const resetAt = now + ttl;
      const remaining = Math.max(limit - count, 0);
      return { success: count <= limit, remaining, resetAt, count };
    } catch {
      // Fail-safe fallback if Redis is unavailable.
      return memoryStore.consume(key, limit, windowMs);
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const ttlKey = `rl:${key}`;
    try {
      const count = await this.redis.incr(ttlKey);
      if (count === 1) {
        await this.redis.pexpire(ttlKey, windowMs);
      }
      const ttl = Math.max(await this.redis.pttl(ttlKey), 0);
      return { count, resetAt: now + ttl };
    } catch {
      return memoryStore.increment(key, windowMs);
    }
  }

  async get(key: string): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const ttlKey = `rl:${key}`;
    try {
      const [val, ttl] = await this.redis.multi().get(ttlKey).pttl(ttlKey).exec() as [unknown, unknown][];
      const raw = Number(val?.[1] ?? 0);
      const ttlMs = Math.max(Number(ttl?.[1] ?? 0), 0);
      return { count: Number.isFinite(raw) ? raw : 0, resetAt: now + ttlMs };
    } catch {
      return memoryStore.get(key);
    }
  }

  async reset(key: string): Promise<void> {
    const ttlKey = `rl:${key}`;
    try {
      await this.redis.del(ttlKey);
    } catch {
      await memoryStore.reset(key);
    }
  }
}

const memoryStore = new MemoryRateLimitStore();

let store: RateLimitStore = memoryStore;

export function initRateLimitStore(): void {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    store = new RedisRateLimitStore(redisUrl);
    console.log("[security] Rate limit store: Redis-ready (REDIS_URL set)");
  } else {
    store = memoryStore;
  }
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  return store.consume(key, limit, windowMs);
}

export async function incrementRateKey(
  key: string,
  windowMs: number
): Promise<{ count: number; resetAt: number }> {
  return store.increment(key, windowMs);
}

export async function getRateKey(
  key: string
): Promise<{ count: number; resetAt: number }> {
  return store.get(key);
}

export async function resetRateKey(key: string): Promise<void> {
  await store.reset(key);
}
