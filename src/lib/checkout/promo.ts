import type { PromoCode } from "@prisma/client";
import type { DbClient, StepResult } from "@/lib/checkout/types";

/** Returns the promo if it exists, is active and hasn't expired. */
export async function findPromo(client: DbClient, code: string, now = new Date()): Promise<PromoCode | null> {
  const promo = await client.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < now)) return null;
  return promo;
}

/** Resolves an optional promo code for an order; a supplied code that can't apply fails the order. */
export async function applyPromo(client: DbClient, code: string | undefined, subtotal: number): Promise<StepResult<PromoCode | null>> {
  if (!code) return { ok: true, value: null };
  const promo = await findPromo(client, code);
  if (!promo || subtotal < promo.minSubtotal) return { ok: false, error: `Promo code ${code} can’t be applied to this order.` };
  return { ok: true, value: promo };
}
