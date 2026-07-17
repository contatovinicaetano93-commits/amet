import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

function memoryRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const current = memoryBuckets.get(params.key);

  if (!current || current.resetAt <= now) {
    memoryBuckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });
    return { ok: true };
  }

  if (current.count >= params.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  memoryBuckets.set(params.key, current);
  return { ok: true };
}

function hasUpstash(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!hasUpstash()) return null;
  const key = `${limit}:${windowMs}`;
  const existing = limiters.get(key);
  if (existing) return existing;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: true,
    prefix: "ava-rl",
  });
  limiters.set(key, limiter);
  return limiter;
}

/**
 * Rate limit com Upstash Redis quando configurado;
 * fallback in-memory por instância serverless.
 */
export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const limiter = getLimiter(params.limit, params.windowMs);
  if (!limiter) {
    return memoryRateLimit(params);
  }

  try {
    const result = await limiter.limit(params.key);
    if (result.success) {
      return { ok: true };
    }
    return {
      ok: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
    };
  } catch {
    // Se Redis falhar, não derruba o app — degrada para memória local.
    return memoryRateLimit(params);
  }
}

export function isUpstashConfigured(): boolean {
  return hasUpstash();
}

export function clientKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
