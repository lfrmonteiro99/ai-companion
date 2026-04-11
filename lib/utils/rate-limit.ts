/**
 * In-memory sliding-window rate limiter.
 * Suitable for serverless/single-instance MVP deployments.
 * For multi-instance production, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Max tokens (requests) in the window */
  maxTokens: number;
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  /** Tokens added per refill interval */
  refillRate: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Create a rate limiter for a named endpoint.
 * Returns an object with a `check` method that returns { allowed, retryAfterMs }.
 */
export function createRateLimiter(name: string, config: RateLimitConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  // Periodic cleanup of stale entries (every 5 minutes)
  const timer = setInterval(() => {
    const now = Date.now();
    const staleThreshold = config.refillIntervalMs * 10;
    for (const [key, entry] of store) {
      if (now - entry.lastRefill > staleThreshold) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  // Allow Node.js process to exit even with this timer running
  if (typeof timer === "object" && "unref" in timer) {
    (timer as { unref: () => void }).unref();
  }

  return {
    check(identifier: string): { allowed: boolean; retryAfterMs?: number } {
      const now = Date.now();
      let entry = store.get(identifier);

      if (!entry) {
        entry = { tokens: config.maxTokens, lastRefill: now };
        store.set(identifier, entry);
      }

      // Refill tokens based on elapsed time
      const elapsed = now - entry.lastRefill;
      const refills = Math.floor(elapsed / config.refillIntervalMs);
      if (refills > 0) {
        entry.tokens = Math.min(config.maxTokens, entry.tokens + refills * config.refillRate);
        entry.lastRefill = now;
      }

      if (entry.tokens >= 1) {
        entry.tokens -= 1;
        return { allowed: true };
      }

      const retryAfterMs = config.refillIntervalMs - (now - entry.lastRefill);
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
    },
  };
}

// Pre-configured limiters for key endpoints
export const chatStreamLimiter = createRateLimiter("chat-stream", {
  maxTokens: 10,
  refillIntervalMs: 10_000,
  refillRate: 2,
});

export const chatHintLimiter = createRateLimiter("chat-hint", {
  maxTokens: 5,
  refillIntervalMs: 30_000,
  refillRate: 2,
});

export const microExerciseLimiter = createRateLimiter("micro-exercise", {
  maxTokens: 10,
  refillIntervalMs: 60_000,
  refillRate: 5,
});

export const evaluateLimiter = createRateLimiter("evaluate", {
  maxTokens: 3,
  refillIntervalMs: 60_000,
  refillRate: 1,
});
