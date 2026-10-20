"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw, ShieldCheck, ShoppingBag, Truck, Wrench } from "lucide-react";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { Gallery } from "@/components/product/gallery";
import { Price } from "@/components/product/price";
import { RatingStars } from "@/components/product/rating-stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Button } from "@/components/ui/button";
import { MAX_PER_LINE } from "@/lib/cart-types";
import { productPerks, type PerkKey } from "@/lib/perks";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { cn, formatPrice } from "@/lib/utils";

type Variant = { id: string; size: string | null; color: string | null; colorHex: string | null; price: number | null; stock: number };
export type ProductViewData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  compareAt: number | null;
  rating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  images: { id: string; url: string; alt: string }[];
  variants: Variant[];
};

const perkIcons: Record<PerkKey, typeof Truck> = { shipping: Truck, returns: RotateCcw, repairs: Wrench, warranty: ShieldCheck };

const unique = <T,>(arr: (T | null)[]) => [...new Set(arr.filter((v): v is T => v !== null))];

export function ProductView({ product }: { product: ProductViewData }) {
  const addToCart = useAddToCart();
  const colors = useMemo(() => unique(product.variants.map((v) => v.color)), [product.variants]);
  const sizes = useMemo(() => unique(product.variants.map((v) => v.size)), [product.variants]);
  const hexFor = (c: string) => product.variants.find((v) => v.color === c)?.colorHex ?? "#999";
  const stockFor = (color: string | null, size: string | null) =>
    product.variants.filter((v) => (color === null || v.color === color) && (size === null || v.size === size)).reduce((s, v) => s + v.stock, 0);

  const [color, setColor] = useState<string | null>(() => colors.find((c) => stockFor(c, null) > 0) ?? colors[0] ?? null);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "added">("idle");
  const [sizeError, setSizeError] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const needsSize = sizes.length > 0;
  const variant = product.variants.find((v) => v.color === (colors.length ? color : null) && v.size === (needsSize ? size : null)) ?? null;
  const price = variant?.price ?? product.price;
  const available = variant ? variant.stock : stockFor(color, null);
  const soldOut = stockFor(null, null) === 0;

  // Jump the gallery to the selected colour's imagery.
  function chooseColor(c: string) {
    setColor(c);
    setQuantity(1);
    if (size && stockFor(c, size) === 0) setSize(null);
    const idx = product.images.findIndex((img) => img.alt.toLowerCase().includes(c.toLowerCase()));
    if (idx >= 0) setImageIndex(idx);
  }

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function add() {
    if (needsSize && !size) {
      setSizeError(true);
      buyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!variant || variant.stock <= 0) return;
    const image = product.images.find((img) => color && img.alt.toLowerCase().includes(color.toLowerCase())) ?? product.images[0];
    const ok = addToCart(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: image?.url ?? "",
        variantLabel: [variant.color, variant.size].filter(Boolean).join(" / "),
        price,
        stock: variant.stock,
      },
      quantity,
      { openDrawer: true },
    );
    if (ok) {
      setStatus("added");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const ctaLabel = soldOut
    ? "Sold out"
    : needsSize && !size
      ? "Select a size"
      : variant && variant.stock === 0
        ? "Out of stock"
        : `Add to bag — ${formatPrice(price * quantity)}`;
  const ctaDisabled = soldOut || Boolean(variant && variant.stock === 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Gallery images={product.images} activeIndex={imageIndex} onIndexChange={setImageIndex} />
      </div>

      <div className="lg:py-4">
        <Link href={`/shop?category=${product.category.slug}`} className="eyebrow text-accent hover:underline">
          {product.category.name}
        </Link>
        <h1 className="mt-4 font-display text-display-lg">{product.name}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Price price={price} compareAt={product.compareAt} className="text-2xl" />
          {product.reviewCount > 0 && (
            <a href="#reviews" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <RatingStars rating={product.rating} />
              <span className="tabular-nums">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </a>
          )}
        </div>
        <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">{product.tagline}</p>

        <div ref={buyRef} className="mt-10 space-y-8 border-t pt-8">
          {colors.length > 0 && (
            <fieldset>
              <legend className="text-sm">
                Colour: <span className="text-muted-foreground">{color}</span>
              </legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {colors.map((c) => {
                  const out = stockFor(c, null) === 0;
                  return (
                    <button
                      key={c}
                      onClick={() => chooseColor(c)}
                      aria-pressed={color === c}
                      aria-label={`${c}${out ? " (sold out)" : ""}`}
                      title={c}
                      className={cn(
                        "relative size-10 rounded-full ring-offset-[3px] ring-offset-background transition",
                        color === c ? "ring-2 ring-foreground" : "ring-1 ring-foreground/15 hover:ring-foreground/40",
                      )}
                    >
                      <span className="absolute inset-0 rounded-full" style={{ background: hexFor(c) }} />
                      {out && <span className="absolute left-1/2 top-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground/70" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {needsSize && (
            <fieldset>
              <div className="flex items-center justify-between">
                <legend className="text-sm">
                  Size: <span className="text-muted-foreground">{size ?? "Select"}</span>
                </legend>
                <Link href="/faq#sizing" className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Size guide
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {sizes.map((s) => {
                  const stock = stockFor(color, s);
                  return (
                    <button
                      key={s}
                      disabled={stock === 0}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                        setQuantity(1);
                      }}
                      aria-pressed={size === s}
                      aria-label={`Size ${s}${stock === 0 ? ", sold out" : stock <= 3 ? `, only ${stock} left` : ""}`}
                      className={cn(
                        "relative h-12 rounded-md border text-sm tabular-nums transition",
                        size === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground/50",
                        stock === 0 && "cursor-not-allowed text-muted-foreground/60 line-through decoration-foreground/30",
                      )}
                    >
                      {s}
                      {stock > 0 && stock <= 3 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warning" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {sizeError && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-3 text-[13px] text-destructive">
                    Please choose a size to continue.
                  </motion.p>
                )}
              </AnimatePresence>
            </fieldset>
          )}

          <StockNote available={available} soldOut={soldOut} />

          <div className="flex flex-wrap gap-3">
            {!soldOut && (
              <QuantityStepper value={quantity} max={Math.max(1, Math.min(available, MAX_PER_LINE))} onChange={setQuantity} />
            )}
            <Button size="lg" onClick={add} disabled={ctaDisabled} className="h-12 min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={status === "added" ? "added" : ctaLabel}
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -18, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2"
                >
                  {status === "added" ? (
                    <>
                      <Check className="size-4" /> Added to bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-4" /> {ctaLabel}
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </Button>
            <WishlistButton productId={product.id} productName={product.name} variant="outline" className="size-12" />
          </div>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          {productPerks.map((perk) => {
            const Icon = perkIcons[perk.key];
            return (
              <li key={perk.key} className="flex gap-3.5 bg-background p-5">
                <Icon className="mt-0.5 size-[18px] shrink-0 text-accent" strokeWidth={1.6} />
                <div>
                  <p className="text-sm font-medium">{perk.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{perk.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky purchase bar once the main button scrolls out of view */}
      <AnimatePresence>
        {showSticky && !soldOut && (
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="glass fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)]"
          >
            <div className="container-page flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {[color, size].filter(Boolean).join(" / ") || "Select options"} · {formatPrice(price)}
                </p>
              </div>
              <Button onClick={add} disabled={ctaDisabled}>
                <ShoppingBag /> {needsSize && !size ? "Select size" : "Add to bag"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StockNote({ available, soldOut }: { available: number; soldOut: boolean }) {
  const [tone, text] = soldOut
    ? ["bg-destructive", "Sold out — restocking soon"]
    : available === 0
      ? ["bg-destructive", "This option is sold out"]
      : available <= 5
        ? ["bg-warning", `Only ${available} left — order soon`]
        : ["bg-success", "In stock, ready to ship"];
  return (
    <p className="flex items-center gap-2.5 text-sm" aria-live="polite">
      <span className="relative flex size-2">
        <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", tone)} />
        <span className={cn("relative inline-flex size-2 rounded-full", tone)} />
      </span>
      {text}
    </p>
  );
}
