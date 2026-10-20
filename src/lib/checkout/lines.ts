import type { DbClient, OrderLine, StepResult, VariantWithProduct } from "@/lib/checkout/types";
import { variantWithProduct } from "@/lib/checkout/types";
import type { PaymentLine } from "@/lib/payments/types";

export const UNAVAILABLE_ITEM_ERROR = "An item in your bag is no longer available. Please review your bag.";

export function variantLabel(v: Pick<VariantWithProduct, "color" | "size">, separator = " / ") {
  return [v.color, v.size].filter(Boolean).join(separator);
}

/** Loads the requested variants and prices every line on the server. */
export async function buildOrderLines(
  client: DbClient,
  items: { variantId: string; quantity: number }[],
): Promise<StepResult<{ lines: OrderLine[]; subtotal: number }>> {
  const variants = await client.variant.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.variantId))] } },
    include: variantWithProduct,
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  if (items.some((i) => !byId.get(i.variantId)?.product.isActive)) return { ok: false, error: UNAVAILABLE_ITEM_ERROR };

  const lines = items.map((item) => {
    const variant = byId.get(item.variantId)!;
    return { variant, quantity: item.quantity, unitPrice: variant.price ?? variant.product.price };
  });
  return { ok: true, value: { lines, subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) } };
}

export function toPaymentLines(lines: OrderLine[]): PaymentLine[] {
  return lines.map((l) => ({
    name: l.variant.product.name,
    description: variantLabel(l.variant),
    image: l.variant.product.images[0]?.url,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
  }));
}
