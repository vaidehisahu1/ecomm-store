import type { Prisma } from "@prisma/client";
import { REVENUE_STATUSES } from "@/lib/order-status";

/**
 * Of the given reviewers, returns those who actually bought the product: they have an order
 * that was paid (PAID, SHIPPED or DELIVERED) and contains it. Pending or cancelled orders don't count.
 */
export async function findVerifiedBuyers(client: Prisma.TransactionClient, productId: string, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await client.order.findMany({
    where: {
      userId: { in: [...new Set(userIds)] },
      status: { in: [...REVENUE_STATUSES] },
      items: { some: { productId } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return new Set(rows.map((r) => r.userId));
}

export function withVerifiedFlag<R extends { userId: string }>(reviews: R[], buyers: Set<string>): (R & { verified: boolean })[] {
  return reviews.map((r) => ({ ...r, verified: buyers.has(r.userId) }));
}
