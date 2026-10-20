import type Stripe from "stripe";

/** The slice of the Stripe client these helpers use; lets tests pass a small fake. */
export type StripeCheckoutApi = { checkout: { sessions: Pick<Stripe.Checkout.SessionsResource, "retrieve" | "expire"> } };

export type SessionCloseResult = "expired" | "already_closed" | "completed" | "no_session";

/**
 * Makes sure a pending order's Checkout Session can no longer be paid. Returns "completed" if the
 * customer already paid. In that case the order must NOT be cancelled; the webhook will mark it paid.
 */
export async function closeCheckoutSession(stripe: StripeCheckoutApi, sessionId: string | null | undefined): Promise<SessionCloseResult> {
  if (!sessionId?.startsWith("cs_")) return "no_session";
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "complete") return "completed";
  if (session.status === "expired") return "already_closed";
  try {
    await stripe.checkout.sessions.expire(sessionId);
    return "expired";
  } catch (error) {
    // Expiring fails if the customer completed payment in the meantime.
    const latest = await stripe.checkout.sessions.retrieve(sessionId);
    if (latest.status === "complete") return "completed";
    if (latest.status === "expired") return "already_closed";
    throw error;
  }
}

export type CompletedSession = {
  id: string;
  payment_status: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id: string } | null;
};

export type CheckoutDeps = {
  findOrder(id: string): Promise<{ id: string; status: string } | null>;
  /** Conditional PENDING → PAID; returns how many rows changed. */
  markPaid(orderId: string, paymentRef: string): Promise<{ count: number }>;
  /** Must be idempotent for the same key (Stripe idempotency keys guarantee this). */
  refund(paymentIntentId: string, idempotencyKey: string): Promise<{ id: string }>;
};

export type CheckoutOutcome =
  | { outcome: "paid" | "already_paid"; orderId: string }
  | { outcome: "refunded"; orderId: string; detail: string }
  | { outcome: "needs_manual_refund"; orderId: string; detail: string }
  | { outcome: "ignored" | "order_not_found"; orderId?: string; detail?: string };

/**
 * Applies a completed Checkout Session to its order. Safe to call repeatedly for the same session
 * (webhook retries, the success page and the webhook racing):
 * - PENDING → PAID (conditional update, so it happens once)
 * - already PAID/SHIPPED/DELIVERED → no-op
 * - CANCELLED (customer paid after we released the stock) → keep it cancelled and refund, or
 *   flag `needs_manual_refund` if the refund call fails
 */
export async function applyCompletedCheckout(session: CompletedSession, deps: CheckoutDeps): Promise<CheckoutOutcome> {
  const orderId = session.metadata?.orderId;
  if (session.payment_status !== "paid") return { outcome: "ignored", orderId, detail: `payment_status=${session.payment_status}` };
  if (!orderId) return { outcome: "ignored", detail: "session has no orderId metadata" };
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  let order = await deps.findOrder(orderId);
  if (!order) return { outcome: "order_not_found", orderId };

  if (order.status === "PENDING") {
    const res = await deps.markPaid(orderId, paymentIntent ?? session.id);
    if (res.count === 1) return { outcome: "paid", orderId };
    order = await deps.findOrder(orderId); // lost a race; see what it became
    if (!order) return { outcome: "order_not_found", orderId };
  }
  if (order.status !== "CANCELLED") return { outcome: "already_paid", orderId };

  if (!paymentIntent) return { outcome: "needs_manual_refund", orderId, detail: `no payment_intent on session ${session.id}` };
  try {
    const refund = await deps.refund(paymentIntent, `refund-cancelled-order-${orderId}`);
    return { outcome: "refunded", orderId, detail: refund.id };
  } catch (error) {
    return { outcome: "needs_manual_refund", orderId, detail: `refund of ${paymentIntent} failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}
