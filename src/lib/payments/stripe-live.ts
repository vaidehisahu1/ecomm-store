import "server-only";
import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import type { CheckoutDeps, CheckoutOutcome } from "@/lib/payments/stripe-checkout";

export function liveCheckoutDeps(stripe: Stripe): CheckoutDeps {
  return {
    findOrder: (id) => db.order.findUnique({ where: { id }, select: { id: true, status: true } }),
    markPaid: markOrderPaid,
    refund: (paymentIntent, idempotencyKey) =>
      stripe.refunds.create({ payment_intent: paymentIntent, metadata: { reason: "paid_after_order_cancelled" } }, { idempotencyKey }),
  };
}

export async function isEventProcessed(eventId: string) {
  return (await db.stripeEvent.count({ where: { id: eventId } })) > 0;
}

/** Stores the outcome. A concurrent duplicate delivery (unique id) is not an error. */
export async function recordStripeEvent(eventId: string, type: string, result: CheckoutOutcome) {
  if (result.outcome === "needs_manual_refund") {
    console.error(`[stripe] NEEDS MANUAL REFUND: order ${result.orderId} — ${result.detail} (event ${eventId})`);
  }
  try {
    await db.stripeEvent.create({ data: { id: eventId, type, orderId: result.orderId ?? null, outcome: result.outcome, detail: "detail" in result ? (result.detail ?? null) : null } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
  }
}
