"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { buildOrderLines, toPaymentLines } from "@/lib/checkout/lines";
import { commitOrder } from "@/lib/checkout/order";
import { applyPromo, findPromo } from "@/lib/checkout/promo";
import { StockError } from "@/lib/checkout/stock";
import { db } from "@/lib/db";
import { cancelAndRestock, generateOrderNumber, markOrderPaid } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { computeTotals, deliveryOptions } from "@/lib/pricing";
import { checkoutSchema, fieldErrors, promoSchema } from "@/lib/validators";
import type { AppliedPromo } from "@/lib/cart-types";

export async function validatePromo(input: { code: string; subtotal: number }): Promise<{ ok: true; promo: AppliedPromo } | { ok: false; error: string }> {
  const parsed = promoSchema.safeParse({ code: input.code });
  if (!parsed.success) return { ok: false, error: "Enter a promo code" };
  // Stops brute-forcing the code space.
  const limited = await rateLimit("promo", await headers());
  if (!limited.success) return { ok: false, error: rateLimitMessage(limited.resetAt) };
  const promo = await findPromo(db, parsed.data.code);
  if (!promo) return { ok: false, error: "That code isn’t valid or has expired" };
  if (input.subtotal < promo.minSubtotal) {
    return { ok: false, error: `Spend $${promo.minSubtotal / 100} or more to use ${promo.code}` };
  }
  return {
    ok: true,
    promo: { code: promo.code, description: promo.description, type: promo.type, value: promo.value, minSubtotal: promo.minSubtotal },
  };
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Orchestrates checkout: validate → price → promo → reserve & record (one transaction) → take payment. */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return { ok: false, error: "Your session has expired. Please sign in again." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const provider = getPaymentProvider();
  if (!provider) return { ok: false, error: "Checkout is temporarily unavailable: no payment provider is configured." };
  const payment = provider.validate({ card: data.card });
  if (!payment.ok) return { ok: false, error: payment.error, fieldErrors: payment.fieldErrors };

  const priced = await buildOrderLines(db, data.items);
  if (!priced.ok) return priced;
  const { lines, subtotal } = priced.value;

  const promo = await applyPromo(db, data.promoCode, subtotal);
  if (!promo.ok) return promo;

  const totals = computeTotals(subtotal, data.deliveryMethod, promo.value);
  let order;
  try {
    order = await commitOrder(db, {
      number: await generateOrderNumber(),
      user: { id: user.id, email: user.email },
      address: data.address,
      deliveryMethod: data.deliveryMethod,
      lines,
      totals,
      promo: promo.value,
      paymentProvider: provider.name,
      cardLast4: data.card?.cardNumber.slice(-4) ?? null,
      saveAddress: data.saveAddress,
    });
  } catch (error) {
    if (error instanceof StockError) return { ok: false, error: error.message };
    console.error("placeOrder failed", error);
    return { ok: false, error: "We couldn’t place your order. You have not been charged — please try again." };
  }

  try {
    const delivery = deliveryOptions[data.deliveryMethod];
    const result = await provider.initiate({
      order: { id: order.id, number: order.number, email: user.email },
      lines: toPaymentLines(lines),
      totals,
      deliveryLabel: `${delivery.label} — ${delivery.eta}`,
      promoCode: promo.value?.code,
    });
    if (result.status === "redirect") return { ok: true, orderNumber: order.number, redirectUrl: result.url };
    await markOrderPaid(order.id, result.paymentRef);
    return { ok: true, orderNumber: order.number };
  } catch (error) {
    console.error(`Payment initiation failed (${provider.name})`, error);
    await db.$transaction((tx) => cancelAndRestock(tx, order.id));
    return { ok: false, error: "Payment could not be started. You have not been charged — please try again." };
  }
}

/** Releases stock held by a Stripe order the customer abandoned on the hosted payment page. */
export async function cancelPendingOrder(input: { number: string }) {
  const parsed = z.object({ number: z.string().min(3).max(20) }).safeParse(input);
  const session = await auth();
  if (!parsed.success || !session?.user?.id) return { ok: false as const };
  const order = await db.order.findUnique({ where: { number: parsed.data.number } });
  if (!order || order.userId !== session.user.id || order.status !== "PENDING" || order.paymentProvider !== "stripe") return { ok: false as const };
  await db.$transaction((tx) => cancelAndRestock(tx, order.id));
  return { ok: true as const };
}
