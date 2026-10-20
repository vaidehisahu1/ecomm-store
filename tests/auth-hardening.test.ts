import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Callbacks = { jwt: (args: { token: Record<string, unknown>; user?: Record<string, unknown> }) => Promise<Record<string, unknown> | null> };
type Credentials = { authorize: (raw: unknown, request: Request) => Promise<unknown> };
let captured: { callbacks: Callbacks; providers: Credentials[] };

const findUnique = vi.fn();
vi.mock("next-auth", () => ({
  default: (config: typeof captured) => {
    captured = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (provider: Credentials) => provider }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ success: true }) }));

const { ROLE_REFRESH_MS } = await import("@/auth");
const request = new Request("http://x");

beforeEach(() => findUnique.mockReset());
afterEach(() => vi.useRealTimers());

describe("login timing", () => {
  it("runs a bcrypt comparison even when the email is unknown", async () => {
    const compare = vi.spyOn(bcrypt, "compare");
    findUnique.mockResolvedValue(null);
    expect(await captured.providers[0].authorize({ email: "nobody@example.com", password: "Whatever123" }, request)).toBeNull();
    expect(compare).toHaveBeenCalledTimes(1);
    const dummyHash = compare.mock.calls[0][1] as string;
    // Same algorithm and cost as real password hashes, so the work done is equivalent.
    expect(dummyHash).toMatch(/^\$2[aby]\$12\$/);
  });
});

describe("role refresh in the session token", () => {
  const now = new Date("2026-10-20T12:00:00Z").getTime();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  it("stamps the role check time at sign-in", async () => {
    const token = await captured.callbacks.jwt({ token: {}, user: { id: "u1", role: "ADMIN" } });
    expect(token).toMatchObject({ id: "u1", role: "ADMIN", roleCheckedAt: now });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("does not hit the database before the refresh interval", async () => {
    const token = { id: "u1", role: "ADMIN", roleCheckedAt: now - ROLE_REFRESH_MS + 1000 };
    expect(await captured.callbacks.jwt({ token })).toEqual(token);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("re-reads the role after 10 minutes so a demotion takes effect", async () => {
    findUnique.mockResolvedValue({ role: "CUSTOMER" });
    const token = await captured.callbacks.jwt({ token: { id: "u1", role: "ADMIN", roleCheckedAt: now - ROLE_REFRESH_MS - 1 } });
    expect(token).toMatchObject({ role: "CUSTOMER", roleCheckedAt: now });
    expect(ROLE_REFRESH_MS).toBe(10 * 60 * 1000);
  });

  it("ends the session if the account was deleted", async () => {
    findUnique.mockResolvedValue(null);
    expect(await captured.callbacks.jwt({ token: { id: "u1", role: "ADMIN", roleCheckedAt: 0 } })).toBeNull();
  });
});
