import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, type CatalogParams } from "@/lib/catalog";
import { findVerifiedBuyers, withVerifiedFlag } from "@/lib/reviews";

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  price: true,
  compareAt: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 2 },
  variants: { select: { id: true, color: true, colorHex: true, size: true, stock: true, price: true } },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function toProductCard(p: ProductCardRow) {
  const colors = new Map<string, string>();
  for (const v of p.variants) if (v.color && v.colorHex) colors.set(v.color, v.colorHex);
  const inStock = p.variants.some((v) => v.stock > 0);
  // Products with a single purchasable configuration can be added straight from the grid.
  const quickAdd = p.variants.length === 1 && p.variants[0].stock > 0 ? p.variants[0] : null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    price: p.price,
    compareAt: p.compareAt,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isNew: Date.now() - p.createdAt.getTime() < 14 * 86400000,
    category: p.category,
    images: p.images,
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    inStock,
    lowStock: inStock && p.variants.reduce((s, v) => s + v.stock, 0) <= 5,
    quickAdd: quickAdd
      ? {
          variantId: quickAdd.id,
          price: quickAdd.price ?? p.price,
          stock: quickAdd.stock,
          label: [quickAdd.color, quickAdd.size].filter(Boolean).join(" / "),
        }
      : null,
  };
}
export type ProductCardData = ReturnType<typeof toProductCard>;

export const getCategories = cache(() =>
  db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  }),
);

export async function getCatalog(params: CatalogParams) {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (params.category) where.category = { slug: params.category };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { tagline: { contains: params.q, mode: "insensitive" } },
      { category: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }
  if (params.min != null || params.max != null) {
    where.price = {
      ...(params.min != null && { gte: params.min * 100 }),
      ...(params.max != null && { lte: params.max * 100 }),
    };
  }
  if (params.rating) where.rating = { gte: params.rating };
  if (params.inStock) where.variants = { some: { stock: { gt: 0 } } };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
    featured: [{ featured: "desc" as const }, { salesCount: "desc" as const }],
    newest: [{ createdAt: "desc" as const }],
    popular: [{ salesCount: "desc" as const }],
    rating: [{ rating: "desc" as const }, { reviewCount: "desc" as const }],
    "price-asc": [{ price: "asc" as const }],
    "price-desc": [{ price: "desc" as const }],
  }[params.sort];

  const page = params.page ?? 1;
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      select: productCardSelect,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);
  return { products: rows.map(toProductCard), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedProducts(take = 8) {
  const rows = await db.product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { salesCount: "desc" },
    select: productCardSelect,
    take,
  });
  return rows.map(toProductCard);
}

export async function getNewArrivals(take = 4) {
  const rows = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
    take,
  });
  return rows.map(toProductCard);
}

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ color: "asc" }] },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!product || !product.isActive) return null;
  const buyers = await findVerifiedBuyers(db, product.id, product.reviews.map((r) => r.userId));
  return { ...product, reviews: withVerifiedFlag(product.reviews, buyers) };
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(productId: string, categoryId: string, take = 4) {
  const rows = await db.product.findMany({
    where: { isActive: true, id: { not: productId }, categoryId },
    orderBy: { salesCount: "desc" },
    select: productCardSelect,
    take,
  });
  if (rows.length >= take) return rows.map(toProductCard);
  const extra = await db.product.findMany({
    where: { isActive: true, id: { notIn: [productId, ...rows.map((r) => r.id)] } },
    orderBy: { rating: "desc" },
    select: productCardSelect,
    take: take - rows.length,
  });
  return [...rows, ...extra].map(toProductCard);
}

export type Spec = { label: string; value: string };

function isSpec(s: unknown): s is Spec {
  return typeof s === "object" && s !== null && typeof (s as Spec).label === "string" && typeof (s as Spec).value === "string";
}

/** Narrows the Json column to well-formed specs, dropping anything malformed. */
export function parseSpecs(value: Prisma.JsonValue): Spec[] {
  return Array.isArray(value) ? value.filter(isSpec) : [];
}
