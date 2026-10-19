import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { productCardSelect, toProductCard } from "@/lib/queries";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: { product: { select: productCardSelect } },
  });

  return (
    <div>
      <h2 className="font-display text-3xl">Wishlist</h2>
      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <Heart className="size-9 text-muted-foreground" strokeWidth={1.4} />
          <p className="mt-5 font-display text-2xl">Nothing saved yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Tap the heart on any product to keep it here for later.</p>
          <Button asChild className="mt-8">
            <Link href="/shop">Discover products</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
          {items.map(({ product }) => (
            <li key={product.id}>
              <ProductCard product={toProductCard(product)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
