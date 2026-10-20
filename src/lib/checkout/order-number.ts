import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";

export const ORDER_NUMBER_ATTEMPTS = 5;

export function randomOrderNumber() {
  return `HL-${randomInt(100_000, 1_000_000)}`;
}

/** True for Postgres unique violations on Order.number (Prisma error P2002). */
export function isOrderNumberCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];
  return fields.some((f) => f === "number" || f.includes("number"));
}

/**
 * Runs `attempt` with a fresh random order number, retrying only when the insert hits the unique
 * constraint. Relying on the constraint (instead of "check, then insert") is race-free. Each retry
 * reruns the whole transaction, because Postgres aborts a transaction after a constraint error.
 */
export async function withUniqueOrderNumber<T>(attempt: (number: string) => Promise<T>, next = randomOrderNumber, maxAttempts = ORDER_NUMBER_ATTEMPTS): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await attempt(next());
    } catch (error) {
      if (!isOrderNumberCollision(error) || i >= maxAttempts) throw error;
    }
  }
}
