import { describe, expect, it } from "vitest";
import { clientIp, MemoryRateLimiter, rateLimitMessage } from "@/lib/rate-limit";

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("MemoryRateLimiter", () => {
  it("allows up to the limit, then blocks", async () => {
    const c = clock();
    const rl = new MemoryRateLimiter({ limit: 3, windowMs: 60_000, now: c.now });
    expect((await rl.limit("ip")).remaining).toBe(2);
    expect((await rl.limit("ip")).remaining).toBe(1);
    expect((await rl.limit("ip")).success).toBe(true);
    const blocked = await rl.limit("ip");
    expect(blocked).toEqual({ success: false, remaining: 0, resetAt: 1_000_000 + 60_000 });
  });

  it("slides: capacity returns as the oldest hits leave the window", async () => {
    const c = clock();
    const rl = new MemoryRateLimiter({ limit: 2, windowMs: 10_000, now: c.now });
    await rl.limit("ip"); // t=0
    c.advance(6_000);
    await rl.limit("ip"); // t=6s
    expect((await rl.limit("ip")).success).toBe(false);
    c.advance(4_001); // first hit is now older than 10s
    expect((await rl.limit("ip")).success).toBe(true);
    expect((await rl.limit("ip")).success).toBe(false);
  });

  it("does not count blocked attempts against the window", async () => {
    const c = clock();
    const rl = new MemoryRateLimiter({ limit: 1, windowMs: 1_000, now: c.now });
    await rl.limit("ip");
    for (let i = 0; i < 5; i++) await rl.limit("ip");
    c.advance(1_001);
    expect((await rl.limit("ip")).success).toBe(true);
  });

  it("tracks keys independently", async () => {
    const rl = new MemoryRateLimiter({ limit: 1, windowMs: 60_000 });
    expect((await rl.limit("a")).success).toBe(true);
    expect((await rl.limit("a")).success).toBe(false);
    expect((await rl.limit("b")).success).toBe(true);
  });

  it("evicts the least-recently-used key beyond maxKeys to bound memory", async () => {
    const rl = new MemoryRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    await rl.limit("a");
    await rl.limit("b");
    await rl.limit("c"); // evicts "a"
    expect((await rl.limit("a")).success).toBe(true);
    expect((await rl.limit("c")).success).toBe(false);
  });
});

describe("clientIp", () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it("uses the first x-forwarded-for hop", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then a shared bucket", () => {
    expect(clientIp(h({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(h({}))).toBe("unknown");
  });
});

describe("rateLimitMessage", () => {
  it("rounds up to whole minutes and pluralises", () => {
    expect(rateLimitMessage(1_000 + 30_000, 1_000)).toMatch(/1 minute\./);
    expect(rateLimitMessage(1_000 + 4 * 60_000 + 1, 1_000)).toMatch(/5 minutes\./);
  });
});
