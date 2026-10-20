import type { DbClient, OrderLine } from "@/lib/checkout/types";
import { variantLabel } from "@/lib/checkout/lines";

/** Thrown inside the order transaction so Prisma rolls back every decrement made so far. */
export class StockError extends Error {}

/**
 * Atomically decrements stock for each line. The `stock >= quantity` guard in the WHERE clause
 * makes the check-and-decrement a single statement, so concurrent checkouts can't oversell.
 * Must run inside a transaction.
 */
export async function reserveStock(tx: DbClient, lines: OrderLine[]) {
  for (const l of lines) {
    const res = await tx.variant.updateMany({
      where: { id: l.variant.id, stock: { gte: l.quantity } },
      data: { stock: { decrement: l.quantity } },
    });
    if (res.count === 0) {
      const fresh = await tx.variant.findUnique({ where: { id: l.variant.id }, select: { stock: true } });
      const label = [l.variant.product.name, variantLabel(l.variant, " · ")].filter(Boolean).join(" · ");
      throw new StockError(
        fresh && fresh.stock > 0 ? `Only ${fresh.stock} left of ${label}. Please update your bag.` : `${label} just sold out. Please update your bag.`,
      );
    }
    await tx.product.update({ where: { id: l.variant.productId }, data: { salesCount: { increment: l.quantity } } });
  }
}
