"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { lines, isOpen, setOpen } = useCart();
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const close = () => setOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="sm:max-w-[440px]">
        <div className="border-b px-6 pb-5 pt-6">
          <SheetTitle className="font-display text-3xl">
            Your bag <span className="font-sans text-base text-muted-foreground tabular-nums">({count})</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Review the items in your bag and continue to checkout.</SheetDescription>
          {count > 0 && (
            <div className="mt-5">
              <FreeShippingMeter subtotal={subtotal} />
            </div>
          )}
        </div>

        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid size-20 place-items-center rounded-full bg-muted"
            >
              <ShoppingBag className="size-8 text-muted-foreground" strokeWidth={1.5} />
            </motion.div>
            <p className="mt-6 font-display text-3xl">Your bag is empty</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Good things are waiting. Start with our most-loved pieces this season.
            </p>
            <Button asChild className="mt-8" onClick={close}>
              <Link href="/shop">
                Explore the collection <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <CartLineItem key={line.variantId} line={line} onNavigate={close} />
                ))}
              </AnimatePresence>
            </ul>
            <div className="space-y-4 border-t bg-card/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-xl font-medium tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping, taxes and promo codes are calculated at checkout.</p>
              <div className="grid gap-2.5">
                <Button asChild size="lg" onClick={close}>
                  <Link href="/checkout">
                    Checkout <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" onClick={close}>
                  <Link href="/cart">View bag</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
