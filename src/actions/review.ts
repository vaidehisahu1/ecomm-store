"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fieldErrors, reviewSchema } from "@/lib/validators";

export type ReviewState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: { title: string; body: string } } | undefined;

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in to write a review." };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: Number(formData.get("rating")),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: { title: String(formData.get("title") ?? ""), body: String(formData.get("body") ?? "") } };
  }
  const { productId, ...review } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { error: "This product no longer exists." };

  await db.$transaction(async (tx) => {
    await tx.review.upsert({
      where: { userId_productId: { userId, productId } },
      update: { ...review, createdAt: new Date() },
      create: { ...review, userId, productId },
    });
    const agg = await tx.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    await tx.product.update({
      where: { id: productId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    });
  });

  revalidatePath(`/product/${product.slug}`);
  return { ok: true };
}
