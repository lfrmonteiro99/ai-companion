/**
 * Generic async retry with exponential backoff.
 * Use for external service calls (OpenAI, etc.) that may transiently fail.
 */
export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  baseDelayMs?: number;
  /** Multiplier for each subsequent delay (default: 2) */
  backoffFactor?: number;
  /** Optional predicate: only retry if this returns true for the error */
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffFactor: 2,
  shouldRetry: () => true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true for errors that are likely transient (network, rate-limit, server errors).
 * Use as `shouldRetry` for OpenAI / HTTP calls.
 */
export function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as Record<string, unknown>;

  // OpenAI SDK errors with status codes
  const status = err.status as number | undefined;
  if (status !== undefined) {
    // Retry on rate limit (429), server errors (500, 502, 503), timeout (408)
    return status === 429 || status === 408 || status >= 500;
  }

  // Network errors
  const code = err.code as string | undefined;
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return true;
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error;
      }

      const delay = opts.baseDelayMs * Math.pow(opts.backoffFactor, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}
