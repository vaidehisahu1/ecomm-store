import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
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

  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const orderId = event.data.object.metadata?.orderId;
    const ref = typeof event.data.object.payment_intent === "string" ? event.data.object.payment_intent : event.data.object.id;
    if (orderId) await markOrderPaid(orderId, ref);
  }
  return NextResponse.json({ received: true });
}
