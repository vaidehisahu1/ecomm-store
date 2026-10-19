import type { DeliveryMethod, DiscountType } from "@prisma/client";

/** All amounts are integer cents. Shared by client (estimates) and server (source of truth). */
export const FREE_SHIPPING_THRESHOLD = 15000;
export const TAX_RATE = 0.0825;

export const deliveryOptions: Record<
  DeliveryMethod,
  { label: string; eta: string; price: number; description: string }
> = {
  STANDARD: { label: "Standard", eta: "4–6 business days", price: 800, description: "Carbon-neutral ground delivery" },
  EXPRESS: { label: "Express", eta: "2–3 business days", price: 1800, description: "Priority handling, tracked end to end" },
  NEXT_DAY: { label: "Next day", eta: "Next business day", price: 3200, description: "Order by 2pm for delivery tomorrow" },
};

export type PromoInput = { code: string; type: DiscountType; value: number; minSubtotal: number };

export function shippingFor(method: DeliveryMethod, subtotal: number, freeShipping = false) {
  if (freeShipping) return 0;
  if (method === "STANDARD" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return deliveryOptions[method].price;
}

export function discountFor(promo: PromoInput | null, subtotal: number) {
  if (!promo || subtotal < promo.minSubtotal) return 0;
  if (promo.type === "PERCENT") return Math.round((subtotal * promo.value) / 100);
  if (promo.type === "FIXED") return Math.min(promo.value, subtotal);
  return 0;
}

export function computeTotals(subtotal: number, method: DeliveryMethod, promo: PromoInput | null) {
  const discount = discountFor(promo, subtotal);
  const shipping = shippingFor(method, subtotal, promo?.type === "FREE_SHIPPING" && subtotal >= promo.minSubtotal);
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  return { subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax };
}
