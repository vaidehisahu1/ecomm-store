import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const querySchema = z.object({ q: z.string().trim().min(1).max(80) });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ q: new URL(request.url).searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ products: [], categories: [] });
  const { q } = parsed.data;

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }, { category: { name: { contains: q, mode: "insensitive" } } }],
      },
      orderBy: { salesCount: "desc" },
      take: 6,
      select: {
        slug: true,
        name: true,
        price: true,
        category: { select: { name: true } },
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    }),
    db.category.findMany({ where: { name: { contains: q, mode: "insensitive" } }, select: { name: true, slug: true }, take: 3 }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      category: p.category.name,
      image: p.images[0]?.url ?? null,
    })),
    categories,
  });
}
