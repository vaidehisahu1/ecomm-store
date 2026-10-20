/**
 * Rate limiting behind a small interface so the backing store can be swapped.
 *
 * ⚠️ Serverless limitation: the default MemoryRateLimiter keeps state in the memory of a
 * single process. On Vercel each function instance has its own memory and instances are
 * recycled, so limits are per-instance and best-effort, not global. For strict limits,
 * implement `RateLimiter` with a shared store, e.g. Upstash Redis:
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   const rl = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "5 m") });
 *   const limiter: RateLimiter = {
 *     async limit(key) { const r = await rl.limit(key); return { success: r.success, remaining: r.remaining, resetAt: r.reset }; },
 *   };
 *
 * and return it from `createLimiter` below.
 */

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the oldest counted request leaves the window. */
  resetAt: number;
};

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

type Options = { limit: number; windowMs: number; now?: () => number; maxKeys?: number };

/** Sliding-window log: allows `limit` requests in any rolling `windowMs` period per key. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly now: () => number;
  private readonly maxKeys: number;

  constructor(private readonly opts: Options) {
    this.now = opts.now ?? Date.now;
    this.maxKeys = opts.maxKeys ?? 10_000;
  }

  async limit(key: string): Promise<RateLimitResult> {
    const now = this.now();
    const windowStart = now - this.opts.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= this.opts.limit) {
      this.hits.set(key, recent);
      return { success: false, remaining: 0, resetAt: recent[0] + this.opts.windowMs };
    }

    recent.push(now);
    // Re-insert so Map order tracks recency, then evict the least-recent key if over capacity.
    this.hits.delete(key);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.hits.delete(this.hits.keys().next().value!);
    return { success: true, remaining: this.opts.limit - recent.length, resetAt: recent[0] + this.opts.windowMs };
  }
}

const MINUTE = 60_000;

/** Per-feature budgets, all keyed by client IP. */
export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 5 * MINUTE },
  /** Backstop on Auth.js's credentials endpoint, which can be called without the login action. */
  credentials: { limit: 20, windowMs: 5 * MINUTE },
  register: { limit: 5, windowMs: 60 * MINUTE },
  contact: { limit: 5, windowMs: 10 * MINUTE },
  newsletter: { limit: 5, windowMs: 10 * MINUTE },
  promo: { limit: 20, windowMs: 10 * MINUTE },
  search: { limit: 60, windowMs: MINUTE },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

function createLimiter(name: RateLimitName): RateLimiter {
  return new MemoryRateLimiter(RATE_LIMITS[name]);
}

// Survive dev hot reloads so limits don't reset on every edit.
const globalForLimiters = globalThis as unknown as { rateLimiters?: Map<RateLimitName, RateLimiter> };
const limiters = (globalForLimiters.rateLimiters ??= new Map());

export function getLimiter(name: RateLimitName): RateLimiter {
  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = createLimiter(name);
    limiters.set(name, limiter);
  }
  return limiter;
}

/** Best-effort client IP. On Vercel `x-forwarded-for` is set by the platform, not the client. */
export function clientIp(headers: Pick<Headers, "get">): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export async function rateLimit(name: RateLimitName, headers: Pick<Headers, "get">) {
  return getLimiter(name).limit(`${name}:${clientIp(headers)}`);
}

export function rateLimitMessage(resetAt: number, now = Date.now()) {
  const minutes = Math.max(1, Math.ceil((resetAt - now) / MINUTE));
  return `You’re doing that a little too often. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
