import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TableSearch } from "@/components/admin/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { cn, formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const { q, category } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] }),
    ...(category && { category: { slug: category } }),
  };
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true, images: { take: 1, orderBy: { position: "asc" } }, variants: { select: { stock: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Products" description={`${products.length} products`}>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus /> New product
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {[{ slug: "", name: "All" }, ...categories].map((c) => (
            <Link
              key={c.slug || "all"}
              href={c.slug ? `/admin/products?category=${c.slug}` : "/admin/products"}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition",
                (category ?? "") === c.slug ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <TableSearch placeholder="Search name or SKU" />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-background/50 text-left text-[12px] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Inventory</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />}
                        </span>
                        <span>
                          <span className="block font-medium hover:underline">{p.name}</span>
                          <span className="block text-[12px] text-muted-foreground">{p.variants.length} variants</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p.category.name}</td>
                    <td className="px-3 py-3 tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-3 py-3">
                      <span className={cn("tabular-nums", stock === 0 ? "text-destructive" : stock <= 10 ? "text-warning" : "")}>
                        {stock === 0 ? "Out of stock" : `${stock} in stock`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <Badge variant={p.isActive ? "success" : "muted"}>{p.isActive ? "Active" : "Hidden"}</Badge>
                        {p.featured && <Badge variant="soft">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
