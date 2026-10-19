"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartCount, useCart } from "@/lib/cart-store";

export function CartButton() {
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen(true)}
      aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative"
    >
      <ShoppingBag className="size-[18px]" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [1.35, 1], opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-accent-foreground"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
