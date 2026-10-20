import "server-only";
import type { OrderStatus, Prisma, PrismaClient } from "@prisma/client";
import { after } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { closeCheckoutSession, type StripeCheckoutApi } from "@/lib/payments/stripe-checkout";
import { stripe as stripeClient } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

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

export const STALE_STATUS_ERROR = "This order was updated by someone else in the meantime. Refresh to see its current status.";

/**
 * Atomically moves an order from `from` to CANCELLED and returns its units to stock. The status
 * guard in the WHERE clause means two concurrent cancels can't both restock; the loser changes
 * nothing and gets `false`. Run inside a transaction so the status flip and restock commit together.
 */
export async function cancelAndRestock(tx: Prisma.TransactionClient, orderId: string, from: OrderStatus): Promise<boolean> {
  const claimed = await tx.order.updateMany({ where: { id: orderId, status: from }, data: { status: "CANCELLED" } });
  if (claimed.count === 0) return false;
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (item.variantId) await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { decrement: item.quantity } } });
  }
  return true;
}

export type StatusChange = { ok: true } | { ok: false; error: string };

/**
 * Validates the transition, then applies it only if the order is still in `from` (optimistic
 * concurrency): if another admin, the webhook or the cron changed it first, nothing is written.
 */
export async function changeOrderStatus(client: Pick<PrismaClient, "$transaction" | "order">, id: string, from: OrderStatus, to: OrderStatus): Promise<StatusChange> {
  if (from === to) return { ok: true };
  if (!canTransition(from, to)) {
    const allowed = nextStatuses(from);
    const label = from.charAt(0) + from.slice(1).toLowerCase();
    return {
      ok: false,
      error: allowed.length
        ? `A ${from.toLowerCase()} order can only move to ${allowed.map((s) => s.toLowerCase()).join(" or ")}.`
        : `${label} orders are final and can’t be changed.`,
    };
  }
  const applied =
    to === "CANCELLED"
      ? await client.$transaction((tx) => cancelAndRestock(tx, id, from))
      : (await client.order.updateMany({ where: { id, status: from }, data: { status: to } })).count === 1;
  return applied ? { ok: true } : { ok: false, error: STALE_STATUS_ERROR };
}

/** Stripe orders unpaid for this long are released. Must exceed STRIPE_SESSION_TTL_MINUTES. */
export const ABANDONED_ORDER_MINUTES = 60;

/**
 * Cancels and restocks PENDING Stripe orders older than the cutoff. Each order gets its own
 * transaction and is re-checked inside it, so an order paid a moment ago is never cancelled.
 */
export async function expireAbandonedOrders(now = new Date(), maxAgeMinutes = ABANDONED_ORDER_MINUTES, stripe: StripeCheckoutApi | null = stripeClient) {
  const cutoff = new Date(now.getTime() - maxAgeMinutes * 60_000);
  const stale = await db.order.findMany({
    where: { status: "PENDING", paymentProvider: "stripe", createdAt: { lt: cutoff } },
    select: { id: true, number: true, paymentRef: true },
  });
  const expired: string[] = [];
  for (const order of stale) {
    // A session that completed but whose webhook hasn't landed yet must not be cancelled.
    if (stripe && (await closeCheckoutSession(stripe, order.paymentRef)) === "completed") continue;
    // Guarded on PENDING, so an order paid a moment ago is left untouched.
    const cancelled = await db.$transaction((tx) => cancelAndRestock(tx, order.id, "PENDING"));
    if (cancelled) expired.push(order.number);
  }
  return expired;
}

/**
 * PENDING → PAID. The conditional update makes this idempotent: only the call that actually
 * flips the status sends the confirmation email, so webhook + success page + retries send one email.
 */
export async function markOrderPaid(orderId: string, paymentRef: string) {
  const res = await db.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "PAID", paymentRef } });
  if (res.count === 1) after(() => sendOrderConfirmation(orderId));
  return res;
}

export async function sendOrderConfirmation(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { sent: false };
  return sendEmail(orderConfirmationEmail(order, absoluteUrl(`/account/orders/${order.number}`)));
}
