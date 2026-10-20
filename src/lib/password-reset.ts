import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { RESET_TOKEN_TTL_MINUTES } from "@/lib/reset-config";

export { RESET_TOKEN_TTL_MINUTES };

type Db = Prisma.TransactionClient;

/** Only this hash is stored, so a database leak doesn't expose usable reset links. */
export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken() {
  const token = randomBytes(32).toString("base64url"); // 256 bits
  return { token, tokenHash: hashResetToken(token) };
}

/** Creates a fresh token and retires any earlier unused ones, so only the newest link works. */
export async function issueResetToken(db: Db, userId: string, now = new Date()) {
  const { token, tokenHash } = generateResetToken();
  await db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  await db.passwordResetToken.create({
    data: { tokenHash, userId, expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000) },
  });
  return token;
}

/** Returns the token record if it exists, is unused and unexpired. */
export async function findValidResetToken(db: Db, token: string, now = new Date()) {
  if (!token) return null;
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= now) return null;
  return record;
}

/**
 * Atomically claims the token (single use) and sets the new password hash. Run inside a transaction.
 * The claim is one conditional UPDATE, so two simultaneous submissions can't both succeed.
 */
export async function consumeResetToken(db: Db, token: string, passwordHash: string, now = new Date()): Promise<{ ok: true; userId: string } | { ok: false }> {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record) return { ok: false };
  const claimed = await db.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count === 0) return { ok: false };
  await db.user.update({ where: { id: record.userId }, data: { passwordHash } });
  // Invalidate any other outstanding links for this account.
  await db.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
  return { ok: true, userId: record.userId };
}
