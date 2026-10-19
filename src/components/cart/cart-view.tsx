"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { OrderTotals } from "@/components/cart/order-totals";
import { PromoCodeInput } from "@/components/cart/promo-code-input";
import { Button } from "@/components/ui/button";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";

export function CartView() {
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useCart.persist.hasHydrated()) setHydrated(true);
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-8">
              <div className="skeleton h-48 w-40 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-1/2 rounded" />
                <div className="skeleton h-4 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-24 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.4} />
        <h2 className="mt-6 font-display text-4xl">Your bag is empty</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">Looks like you haven’t added anything yet. Our new season is a good place to start.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">
            Start shopping <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div>
        <div className="flex items-center justify-between border-b pb-5 text-sm text-muted-foreground">
          <span>
            {cartCount(lines)} {cartCount(lines) === 1 ? "item" : "items"}
          </span>
          <Link href="/shop" className="underline-offset-4 hover:text-foreground hover:underline">
            Continue shopping
          </Link>
        </div>
        <ul className="divide-y">
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <CartLineItem key={line.variantId} line={line} size="lg" />
            ))}
          </AnimatePresence>
        </ul>
      </div>
      <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
        <div className="space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="font-display text-3xl">Summary</h2>
          <FreeShippingMeter subtotal={subtotal} />
          <PromoCodeInput />
          <OrderTotals subtotal={subtotal} method="STANDARD" promo={promo} estimate />
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">
              Secure checkout <ArrowRight />
            </Link>
          </Button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <Lock className="size-3.5" /> Encrypted checkout · 30-day free returns
          </p>
        </div>
      </aside>
    </div>
  );
}
