import { NextResponse } from "next/server";
import { applyCompletedCheckout } from "@/lib/payments/stripe-checkout";
import { isEventProcessed, liveCheckoutDeps, recordStripeEvent } from "@/lib/payments/stripe-live";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });
  // Stripe retries deliveries; each event is applied at most once.
  if (await isEventProcessed(event.id)) return NextResponse.json({ received: true, duplicate: true });

  // Errors here return 500 so Stripe retries; every step is idempotent.
  const result = await applyCompletedCheckout(event.data.object, liveCheckoutDeps(stripe));
  await recordStripeEvent(event.id, event.type, result);
  return NextResponse.json({ received: true, outcome: result.outcome });
}
