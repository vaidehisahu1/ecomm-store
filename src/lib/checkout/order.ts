import type { DeliveryMethod, Order, PromoCode } from "@prisma/client";
import { variantLabel } from "@/lib/checkout/lines";
import { reserveStock } from "@/lib/checkout/stock";
import type { DbClient, OrderLine, TransactionalDb } from "@/lib/checkout/types";
import type { computeTotals } from "@/lib/pricing";
import type { AddressInput } from "@/lib/validators";

export type NewOrder = {
  number: string;
  user: { id: string; email: string };
  address: AddressInput;
  deliveryMethod: DeliveryMethod;
  lines: OrderLine[];
  totals: ReturnType<typeof computeTotals>;
  promo: PromoCode | null;
  paymentProvider: string;
  cardLast4: string | null;
};

/** Inserts the order (always PENDING; the payment provider settles it) with its line snapshots. */
export function createOrderRecord(tx: DbClient, o: NewOrder): Promise<Order> {
  const a = o.address;
  return tx.order.create({
    data: {
      number: o.number,
      status: "PENDING",
      email: o.user.email,
      ...o.totals,
      promoCode: o.promo?.code,
      deliveryMethod: o.deliveryMethod,
      paymentProvider: o.paymentProvider,
      cardLast4: o.cardLast4,
      shipName: a.fullName,
      shipLine1: a.line1,
      shipLine2: a.line2 || null,
      shipCity: a.city,
      shipState: a.state,
      shipPostalCode: a.postalCode,
      shipCountry: a.country,
      shipPhone: a.phone,
      userId: o.user.id,
      items: {
        create: o.lines.map((l) => ({
          name: l.variant.product.name,
          image: l.variant.product.images[0]?.url ?? "",
          variant: variantLabel(l.variant),
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          productId: l.variant.productId,
          variantId: l.variant.id,
        })),
      },
    },
  });
}

/** Adds the shipping address to the user's book unless it's already there. First address becomes default. */
export async function saveAddressIfRequested(tx: DbClient, userId: string, address: AddressInput, requested: boolean) {
  if (!requested) return;
  const duplicate = await tx.address.findFirst({ where: { userId, line1: address.line1, postalCode: address.postalCode } });
  if (duplicate) return;
  const count = await tx.address.count({ where: { userId } });
  await tx.address.create({
    data: { ...address, line2: address.line2 || null, isDefault: count === 0, label: address.label || "Home", userId },
  });
}

/**
 * One transaction: reserve stock → create order → clear the saved cart → optionally save the address.
 * Any throw (including StockError) rolls the whole thing back.
 */
export function commitOrder(db: TransactionalDb, o: NewOrder & { saveAddress: boolean }): Promise<Order> {
  return db.$transaction(async (tx) => {
    await reserveStock(tx, o.lines);
    const order = await createOrderRecord(tx, o);
    await tx.cartItem.deleteMany({ where: { userId: o.user.id } });
    await saveAddressIfRequested(tx, o.user.id, o.address, o.saveAddress);
    return order;
  });
}
