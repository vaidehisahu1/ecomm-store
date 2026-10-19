import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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
