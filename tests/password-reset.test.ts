import type { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeResetToken, findValidResetToken, generateResetToken, hashResetToken, issueResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";

function makeDb() {
  const m = {
    passwordResetToken: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
  };
  return { m, db: m as unknown as Prisma.TransactionClient };
}

const now = new Date("2026-10-20T10:00:00Z");
let m: ReturnType<typeof makeDb>["m"];
let db: Prisma.TransactionClient;
beforeEach(() => ({ m, db } = makeDb()));

describe("reset tokens", () => {
  it("generates 256-bit URL-safe tokens and stores only their SHA-256 hash", () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toBe(hashResetToken(token));
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toContain(token);
    expect(generateResetToken().token).not.toBe(token);
  });

  it("issues a token expiring in 30 minutes and retires older unused ones first", async () => {
    const token = await issueResetToken(db, "u1", now);
    expect(m.passwordResetToken.updateMany).toHaveBeenCalledWith({ where: { userId: "u1", usedAt: null }, data: { usedAt: now } });
    const data = m.passwordResetToken.create.mock.calls[0][0].data;
    expect(data).toEqual({ tokenHash: hashResetToken(token), userId: "u1", expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000) });
    expect(JSON.stringify(data)).not.toContain(token);
    expect(m.passwordResetToken.updateMany.mock.invocationCallOrder[0]).toBeLessThan(m.passwordResetToken.create.mock.invocationCallOrder[0]);
  });

  it.each([
    ["unknown", null],
    ["used", { id: "t", usedAt: now, expiresAt: new Date(now.getTime() + 60_000) }],
    ["expired", { id: "t", usedAt: null, expiresAt: now }],
  ])("treats an %s token as invalid", async (_c, record) => {
    m.passwordResetToken.findUnique.mockResolvedValue(record);
    expect(await findValidResetToken(db, "abc", now)).toBeNull();
  });

  it("looks tokens up by hash, never by the raw value", async () => {
    m.passwordResetToken.findUnique.mockResolvedValue({ id: "t", usedAt: null, expiresAt: new Date(now.getTime() + 60_000) });
    expect(await findValidResetToken(db, "raw-token", now)).not.toBeNull();
    expect(m.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: hashResetToken("raw-token") } });
  });
});

describe("consumeResetToken", () => {
  const record = { id: "t1", userId: "u1", usedAt: null, expiresAt: new Date(now.getTime() + 60_000) };

  it("claims the token atomically, sets the password and retires other tokens", async () => {
    m.passwordResetToken.findUnique.mockResolvedValue(record);
    m.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 2 });
    expect(await consumeResetToken(db, "raw", "new-hash", now)).toEqual({ ok: true, userId: "u1" });
    expect(m.passwordResetToken.updateMany.mock.calls[0][0]).toEqual({ where: { id: "t1", usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    expect(m.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { passwordHash: "new-hash" } });
    expect(m.passwordResetToken.updateMany.mock.calls[1][0]).toEqual({ where: { userId: "u1", usedAt: null }, data: { usedAt: now } });
  });

  it("refuses a token that was already used or expired (claim matches no rows) without touching the password", async () => {
    m.passwordResetToken.findUnique.mockResolvedValue(record);
    m.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeResetToken(db, "raw", "new-hash", now)).toEqual({ ok: false });
    expect(m.user.update).not.toHaveBeenCalled();
  });

  it("refuses an unknown token", async () => {
    m.passwordResetToken.findUnique.mockResolvedValue(null);
    expect(await consumeResetToken(db, "nope", "h", now)).toEqual({ ok: false });
    expect(m.passwordResetToken.updateMany).not.toHaveBeenCalled();
  });
});
