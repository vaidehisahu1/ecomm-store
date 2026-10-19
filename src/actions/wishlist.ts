"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({ productId: z.string().min(1) });

export async function toggleWishlist(input: z.infer<typeof schema>) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, reason: "auth" as const };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid" as const };
  const { productId } = parsed.data;

  const existing = await db.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return { ok: false as const, reason: "invalid" as const };
    await db.wishlistItem.create({ data: { userId, productId } });
  }
  revalidatePath("/account/wishlist");
  return { ok: true as const, saved: !existing };
}
