import "server-only";
import type Stripe from "stripe";
import { site } from "@/lib/site";
import type { PaymentContext, PaymentProvider } from "@/lib/payments/types";
import { absoluteUrl } from "@/lib/utils";

/** Redirects to Stripe Checkout. Discounts become a one-off coupon; shipping a fixed-amount rate; tax a line item. */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  constructor(private readonly stripe: Stripe) {}

  validate() {
    // Card details are collected on Stripe's hosted page.
    return { ok: true as const };
  }

  async initiate({ order, lines, totals, deliveryLabel, promoCode }: PaymentContext) {
    const coupon =
      totals.discount > 0
        ? await this.stripe.coupons.create({ amount_off: totals.discount, currency: "usd", duration: "once", name: promoCode ?? undefined })
        : null;
    const checkout = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      line_items: [
        ...lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.unitPrice,
            product_data: { name: l.name, description: l.description || undefined, images: l.image ? [l.image] : undefined },
          },
        })),
        ...(totals.tax > 0 ? [{ quantity: 1, price_data: { currency: "usd", unit_amount: totals.tax, product_data: { name: "Sales tax" } } }] : []),
      ],
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      shipping_options: [
        { shipping_rate_data: { type: "fixed_amount", display_name: deliveryLabel, fixed_amount: { amount: totals.shipping, currency: "usd" } } },
      ],
      success_url: absoluteUrl(`/checkout/success?order=${order.number}&session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: absoluteUrl(`/checkout?canceled=${order.number}`),
      payment_intent_data: { description: `${site.name} order ${order.number}` },
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
    return { status: "redirect" as const, url: checkout.url };
  }
}
