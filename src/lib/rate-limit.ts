// Simple in-memory rate limiter (swap to Redis for production)
const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number; // time window in ms
  max: number; // max requests per window
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  max: 30,
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULTS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

// Stricter limits for expensive operations
export const AI_GENERATION_LIMIT: RateLimitConfig = {
  windowMs: 300_000, // 5 minutes
  max: 5,
};

export const LAUNCH_LIMIT: RateLimitConfig = {
  windowMs: 600_000, // 10 minutes
  max: 3,
};

export const UPLOAD_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 10,
};

