import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
  ]);
  const staticPages = ["", "/shop", "/about", "/contact", "/faq", "/shipping-returns", "/privacy", "/terms"];
  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p || "/"), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/shop?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: absoluteUrl(`/product/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
