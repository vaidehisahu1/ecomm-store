import type { OrderStatus } from "@prisma/client";

/** Orders whose money has actually been taken. PENDING (awaiting payment) and CANCELLED never count as revenue. */
export const REVENUE_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const satisfies readonly OrderStatus[];

export function countsAsRevenue(status: OrderStatus): boolean {
  return (REVENUE_STATUSES as readonly OrderStatus[]).includes(status);
}
