import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { auth } from "@/auth";
import { OrderStatusBadge } from "@/components/account/order-status";
import { ClearCart } from "@/components/checkout/clear-cart";
import { PendingMark, SuccessMark } from "@/components/checkout/success-mark";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { countsAsRevenue } from "@/lib/order-status";
import { deliveryOptions } from "@/lib/pricing";
import { applyCompletedCheckout } from "@/lib/payments/stripe-checkout";
import { liveCheckoutDeps, recordStripeEvent } from "@/lib/payments/stripe-live";
import { stripe } from "@/lib/stripe";
import { site } from "@/lib/site";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

type Props = { searchParams: Promise<{ order?: string; session_id?: string }> };

export default async function SuccessPage({ searchParams }: Props) {
  const { order: number, session_id: sessionId } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!number) notFound();

  let order = await db.order.findUnique({ where: { number }, include: { items: true } });
  if (!order || order.userId !== session.user.id) notFound();

  // Apply the Stripe result on return as well as via the webhook (which may not be configured).
  // Idempotent: marks PENDING orders paid, and refunds a payment that arrived after cancellation.
  let refundOutcome: "refunded" | "needs_manual_refund" | null = null;
  if ((order.status === "PENDING" || order.status === "CANCELLED") && order.paymentProvider === "stripe" && sessionId && stripe) {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (checkout.metadata?.orderId === order.id && checkout.payment_status === "paid") {
      const result = await applyCompletedCheckout(checkout, liveCheckoutDeps(stripe));
      if (result.outcome === "refunded" || result.outcome === "needs_manual_refund") {
        refundOutcome = result.outcome;
        await recordStripeEvent(`checkout_return:${checkout.id}`, "checkout.session.completed", result);
      }
      order = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    }
  }

  const eta = deliveryOptions[order.deliveryMethod];
  const confirmed = countsAsRevenue(order.status);
  const emailConfigured = isEmailConfigured();

  return (
    <div className="mx-auto max-w-3xl">
      {order.status !== "CANCELLED" && <ClearCart />}
      <div className="text-center">
        {confirmed ? <SuccessMark /> : <PendingMark cancelled={order.status === "CANCELLED"} />}
        <p className="eyebrow mt-8 text-accent">
          {confirmed ? "Order confirmed" : order.status === "CANCELLED" ? "Order cancelled" : "Payment processing"} · {order.number}
        </p>
        <h1 className="mt-4 font-display text-display-lg">
          {order.status === "CANCELLED" ? (
            "This order was cancelled."
          ) : (
            <>
              Thank you, <em>{order.shipName.split(" ")[0]}</em>.
            </>
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {confirmed ? (
            <>
              Your payment was received and our studio is preparing your order. Expected delivery:{" "}
              <span className="text-foreground">{eta.eta.toLowerCase()}</span>.
            </>
          ) : order.status === "CANCELLED" ? (
            refundOutcome === "refunded"
              ? "Your payment arrived after this order had expired, so we’ve refunded it in full. Refunds take 5–10 business days to appear."
              : refundOutcome === "needs_manual_refund"
                ? `Your payment arrived after this order had expired. We’ll refund it in full — our team has been notified. Questions? ${site.email}`
                : "No payment was taken for this order. Any held items have been released back to stock."
          ) : (
            "We’re waiting for your payment to be confirmed. This usually takes a few seconds — refresh this page or check your orders shortly."
          )}
        </p>
        {confirmed && emailConfigured && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> A confirmation email was sent to {order.email}
          </p>
        )}
      </div>

      <div className="mt-12 overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt, { dateStyle: "long" })}</p>
            <p className="font-mono text-sm">{order.number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <ul className="divide-y px-6 sm:px-8">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-5">
              <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <span className="flex-1 text-sm">
                <span className="block font-medium">{item.name}</span>
                <span className="block text-muted-foreground">
                  {item.variant} · Qty {item.quantity}
                </span>
              </span>
              <span className="text-sm tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-8 border-t bg-background/50 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <div className="text-sm">
            <p className="eyebrow text-muted-foreground">Shipping to</p>
            <p className="mt-3 leading-relaxed">
              {order.shipName}
              <br />
              {order.shipLine1}
              {order.shipLine2 && <>, {order.shipLine2}</>}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPostalCode}
              <br />
              {order.shipCountry}
            </p>
            <p className="mt-3 text-muted-foreground">
              {eta.label} delivery{order.cardLast4 && <> · Card •••• {order.cardLast4}</>}
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({order.promoCode})</dt>
                <dd className="tabular-nums text-accent">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={`/account/orders/${order.number}`}>
            Track your order <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
