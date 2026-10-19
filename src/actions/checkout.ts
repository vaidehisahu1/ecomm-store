"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cancelAndRestock, generateOrderNumber } from "@/lib/orders";
import { computeTotals, deliveryOptions } from "@/lib/pricing";
import { site } from "@/lib/site";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { checkoutSchema, fieldErrors, promoSchema } from "@/lib/validators";
import type { AppliedPromo } from "@/lib/cart-types";

async function findPromo(code: string) {
  const promo = await db.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date())) return null;
  return promo;
}

export async function validatePromo(input: { code: string; subtotal: number }): Promise<{ ok: true; promo: AppliedPromo } | { ok: false; error: string }> {
  const parsed = promoSchema.safeParse({ code: input.code });
  if (!parsed.success) return { ok: false, error: "Enter a promo code" };
  const promo = await findPromo(parsed.data.code);
  if (!promo) return { ok: false, error: "That code isn’t valid or has expired" };
  if (input.subtotal < promo.minSubtotal) {
    return { ok: false, error: `Spend $${promo.minSubtotal / 100} or more to use ${promo.code}` };
  }
  return {
    ok: true,
    promo: { code: promo.code, description: promo.description, type: promo.type, value: promo.value, minSubtotal: promo.minSubtotal },
  };
}

class StockError extends Error {}
class PaymentError extends Error {}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return { ok: false, error: "Your session has expired. Please sign in again." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const useStripe = stripe !== null;
  if (!useStripe) {
    if (!data.card) return { ok: false, error: "Enter your card details.", fieldErrors: { "card.cardNumber": "Card details are required" } };
    // Mirrors Stripe's test cards so the mock flow can demonstrate a decline.
    if (data.card.cardNumber === "4000000000000002") return { ok: false, error: "Your card was declined. Try another card." };
  }

  // Price everything on the server — client prices are never trusted.
  const variantIds = [...new Set(data.items.map((i) => i.variantId))];
  const variants = await db.variant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  if (data.items.some((i) => !byId.get(i.variantId)?.product.isActive)) {
    return { ok: false, error: "An item in your bag is no longer available. Please review your bag." };
  }
  const lines = data.items.map((item) => {
    const v = byId.get(item.variantId)!;
    return { variant: v, quantity: item.quantity, unitPrice: v.price ?? v.product.price };
  });
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let promo = null;
  if (data.promoCode) {
    promo = await findPromo(data.promoCode);
    if (!promo || subtotal < promo.minSubtotal) return { ok: false, error: `Promo code ${data.promoCode} can’t be applied to this order.` };
  }
  const totals = computeTotals(subtotal, data.deliveryMethod, promo);
  const orderNumber = await generateOrderNumber();
  const cardLast4 = data.card?.cardNumber.slice(-4) ?? null;

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      // Atomic decrement guarded by a stock check prevents overselling under concurrent checkouts.
      for (const l of lines) {
        const res = await tx.variant.updateMany({
          where: { id: l.variant.id, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (res.count === 0) {
          const fresh = await tx.variant.findUnique({ where: { id: l.variant.id }, select: { stock: true } });
          const label = [l.variant.product.name, l.variant.color, l.variant.size].filter(Boolean).join(" · ");
          throw new StockError(
            fresh && fresh.stock > 0 ? `Only ${fresh.stock} left of ${label}. Please update your bag.` : `${label} just sold out. Please update your bag.`,
          );
        }
        await tx.product.update({ where: { id: l.variant.productId }, data: { salesCount: { increment: l.quantity } } });
      }

      const a = data.address;
      const created = await tx.order.create({
        data: {
          number: orderNumber,
          status: useStripe ? "PENDING" : "PAID",
          email: user.email!,
          ...totals,
          promoCode: promo?.code,
          deliveryMethod: data.deliveryMethod,
          paymentProvider: useStripe ? "stripe" : "mock",
          paymentRef: useStripe ? null : `mock_${crypto.randomUUID().slice(0, 18)}`,
          cardLast4,
          shipName: a.fullName,
          shipLine1: a.line1,
          shipLine2: a.line2 || null,
          shipCity: a.city,
          shipState: a.state,
          shipPostalCode: a.postalCode,
          shipCountry: a.country,
          shipPhone: a.phone,
          userId: user.id!,
          items: {
            create: lines.map((l) => ({
              name: l.variant.product.name,
              image: l.variant.product.images[0]?.url ?? "",
              variant: [l.variant.color, l.variant.size].filter(Boolean).join(" / "),
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              productId: l.variant.productId,
              variantId: l.variant.id,
            })),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      if (data.saveAddress) {
        const duplicate = await tx.address.findFirst({ where: { userId: user.id, line1: a.line1, postalCode: a.postalCode } });
        if (!duplicate) {
          const count = await tx.address.count({ where: { userId: user.id } });
          await tx.address.create({
            data: { ...a, line2: a.line2 || null, isDefault: count === 0, label: a.label || "Home", userId: user.id! },
          });
        }
      }
      return created;
    });
  } catch (error) {
    if (error instanceof StockError) return { ok: false, error: error.message };
    console.error("placeOrder failed", error);
    return { ok: false, error: "We couldn’t place your order. You have not been charged — please try again." };
  }

  if (!stripe) return { ok: true, orderNumber: order.number };

  try {
    const coupon =
      totals.discount > 0 ? await stripe.coupons.create({ amount_off: totals.discount, currency: "usd", duration: "once", name: promo?.code }) : null;
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      line_items: [
        ...lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.unitPrice,
            product_data: {
              name: l.variant.product.name,
              description: [l.variant.color, l.variant.size].filter(Boolean).join(" / ") || undefined,
              images: l.variant.product.images[0] ? [l.variant.product.images[0].url] : undefined,
            },
          },
        })),
        ...(totals.tax > 0 ? [{ quantity: 1, price_data: { currency: "usd", unit_amount: totals.tax, product_data: { name: "Sales tax" } } }] : []),
      ],
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `${deliveryOptions[data.deliveryMethod].label} — ${deliveryOptions[data.deliveryMethod].eta}`,
            fixed_amount: { amount: totals.shipping, currency: "usd" },
          },
        },
      ],
      success_url: absoluteUrl(`/checkout/success?order=${order.number}&session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: absoluteUrl(`/checkout?canceled=${order.number}`),
      payment_intent_data: { description: `${site.name} order ${order.number}` },
    });
    if (!checkout.url) throw new PaymentError("Stripe did not return a checkout URL");
    return { ok: true, orderNumber: order.number, redirectUrl: checkout.url };
  } catch (error) {
    console.error("Stripe session failed", error);
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
