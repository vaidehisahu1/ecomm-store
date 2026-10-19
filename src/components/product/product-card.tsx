"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Price } from "@/components/product/price";
import { RatingStars } from "@/components/product/rating-stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/lib/queries";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority = false, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);
  const [primary, secondary] = product.images;
  const discount = product.compareAt && product.compareAt > product.price ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  function quickAdd() {
    if (!product.quickAdd) return;
    const ok = addToCart({
      variantId: product.quickAdd.variantId,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: primary?.url ?? "",
      variantLabel: product.quickAdd.label,
      price: product.quickAdd.price,
      stock: product.quickAdd.stock,
    });
    if (ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    }
  }

  return (
    <article className={cn("group relative", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 block" tabIndex={-1} aria-hidden>
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              className={cn(
                "object-cover transition-[transform,opacity] duration-[1.1s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]",
                secondary && "group-hover:opacity-0",
                !product.inStock && "opacity-70 grayscale-[35%]",
              )}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
              className="scale-[1.04] object-cover opacity-0 transition-[transform,opacity] duration-[1.1s] ease-[var(--ease-out-expo)] group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock ? (
            <Badge variant="glass">Sold out</Badge>
          ) : discount > 0 ? (
            <Badge variant="accent">−{discount}%</Badge>
          ) : product.isNew ? (
            <Badge variant="glass">New</Badge>
          ) : null}
          {product.lowStock && <Badge variant="glass">Almost gone</Badge>}
        </div>

        <WishlistButton productId={product.id} productName={product.name} className="absolute right-3 top-3" />

        {product.quickAdd && (
          <div className="absolute bottom-3 right-3 transition-all duration-500 ease-[var(--ease-out-expo)] lg:left-3 lg:translate-y-2 lg:opacity-0 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
            <button
              onClick={quickAdd}
              aria-label={`Quick add ${product.name} to bag`}
              className="glass flex size-10 items-center justify-center gap-2 rounded-full border border-white/30 text-[13px] font-medium shadow-soft transition hover:bg-background lg:h-11 lg:w-full"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? "added" : "add"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  {added ? <Check className="size-4" /> : <Plus className="size-4" />}
                  <span className="max-lg:sr-only">{added ? "Added" : "Quick add"}</span>
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">{product.category.name}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-medium">
            <Link href={`/product/${product.slug}`} className="hover:underline underline-offset-4">
              {product.name}
            </Link>
          </h3>
        </div>
        <Price price={product.price} compareAt={product.compareAt} className="shrink-0 text-[15px]" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        {product.colors.length > 0 ? (
          <ul className="flex items-center gap-1.5" aria-label={`Available colours: ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.slice(0, 5).map((c) => (
              <li key={c.name} title={c.name} className="size-3 rounded-full ring-1 ring-foreground/15 ring-offset-1 ring-offset-background" style={{ background: c.hex }} />
            ))}
          </ul>
        ) : (
          <span />
        )}
        {product.reviewCount > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <RatingStars rating={product.rating} size={11} />
            <span className="tabular-nums">({product.reviewCount})</span>
          </span>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5] rounded-xl" />
      <div className="skeleton mt-4 h-3 w-1/3 rounded" />
      <div className="mt-2 flex justify-between">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    </div>
  );
}
