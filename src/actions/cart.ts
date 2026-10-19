"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MAX_PER_LINE, type CartLine } from "@/lib/cart-types";
import { cartLineSchema } from "@/lib/validators";

const linesSchema = z.array(cartLineSchema).max(50);

async function loadLines(entries: { variantId: string; quantity: number }[]): Promise<CartLine[]> {
  if (entries.length === 0) return [];
  const variants = await db.variant.findMany({
    where: { id: { in: entries.map((e) => e.variantId) }, product: { isActive: true } },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  return entries.flatMap((e) => {
    const v = byId.get(e.variantId);
    if (!v || v.stock <= 0) return [];
    return [
      {
        variantId: v.id,
        productId: v.productId,
        slug: v.product.slug,
        name: v.product.name,
        image: v.product.images[0]?.url ?? "",
        variantLabel: [v.color, v.size].filter(Boolean).join(" / "),
        price: v.price ?? v.product.price,
        quantity: Math.min(e.quantity, v.stock, MAX_PER_LINE),
        stock: v.stock,
      },
    ];
  });
}

/**
 * Reconciles the browser cart with the server.
 * Signed-in: merges local lines into the saved cart (keeping the larger quantity) and returns the saved cart.
 * Guest: returns the same lines with fresh prices and stock levels.
 */
export async function syncCart(input: unknown): Promise<CartLine[]> {
  const parsed = linesSchema.safeParse(input);
  const local = parsed.success ? parsed.data : [];
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return loadLines(local);

  const saved = await db.cartItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const merged = new Map(saved.map((s) => [s.variantId, s.quantity]));
  for (const l of local) merged.set(l.variantId, Math.max(merged.get(l.variantId) ?? 0, l.quantity));

  const lines = await loadLines([...merged].map(([variantId, quantity]) => ({ variantId, quantity })));
  await db.$transaction([
    db.cartItem.deleteMany({ where: { userId, variantId: { notIn: lines.map((l) => l.variantId) } } }),
    ...lines.map((l) =>
      db.cartItem.upsert({
        where: { userId_variantId: { userId, variantId: l.variantId } },
        update: { quantity: l.quantity },
        create: { userId, variantId: l.variantId, quantity: l.quantity },
      }),
    ),
  ]);
  return lines;
}

const setLineSchema = z.object({ variantId: z.string().min(1), quantity: z.number().int().min(0).max(MAX_PER_LINE) });

/** Persists a single line change for signed-in users. Quantity 0 removes the line. */
export async function setCartLine(input: z.infer<typeof setLineSchema>) {
  const session = await auth();
  const userId = session?.user?.id;
  const parsed = setLineSchema.safeParse(input);
  if (!userId || !parsed.success) return { ok: false as const };
  const { variantId, quantity } = parsed.data;
  if (quantity === 0) {
    await db.cartItem.deleteMany({ where: { userId, variantId } });
    return { ok: true as const };
  }
  const variant = await db.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
  if (!variant) return { ok: false as const };
  const qty = Math.min(quantity, variant.stock);
  await db.cartItem.upsert({
    where: { userId_variantId: { userId, variantId } },
    update: { quantity: qty },
    create: { userId, variantId, quantity: qty },
  });
  return { ok: true as const };
}
