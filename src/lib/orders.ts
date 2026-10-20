import "server-only";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Order lifecycle. DELIVERED and CANCELLED are final: a cancelled order has already
 * returned its stock, so reopening it would double-count inventory.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Cancels an order and returns its units to stock. Safe to call only on non-cancelled orders. */
export async function cancelAndRestock(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.status === "CANCELLED") return order;
  for (const item of order.items) {
    if (item.variantId) await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { decrement: item.quantity } } });
  }
  return tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
}

/** Stripe orders unpaid for this long are released. Must exceed STRIPE_SESSION_TTL_MINUTES. */
export const ABANDONED_ORDER_MINUTES = 60;

/**
 * Cancels and restocks PENDING Stripe orders older than the cutoff. Each order gets its own
 * transaction and is re-checked inside it, so an order paid a moment ago is never cancelled.
 */
export async function expireAbandonedOrders(now = new Date(), maxAgeMinutes = ABANDONED_ORDER_MINUTES) {
  const cutoff = new Date(now.getTime() - maxAgeMinutes * 60_000);
  const stale = await db.order.findMany({
    where: { status: "PENDING", paymentProvider: "stripe", createdAt: { lt: cutoff } },
    select: { id: true, number: true },
  });
  const expired: string[] = [];
  for (const order of stale) {
    const cancelled = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: order.id }, select: { status: true } });
      if (current?.status !== "PENDING") return false;
      await cancelAndRestock(tx, order.id);
      return true;
    });
    if (cancelled) expired.push(order.number);
  }
  return expired;
}

export async function markOrderPaid(orderId: string, paymentRef: string) {
  return db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "PAID", paymentRef } });
}

export async function generateOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `HL-${Math.floor(100000 + Math.random() * 900000)}`;
    const exists = await db.order.findUnique({ where: { number }, select: { id: true } });
    if (!exists) return number;
  }
  return `HL-${Date.now().toString(36).toUpperCase()}`;
}
