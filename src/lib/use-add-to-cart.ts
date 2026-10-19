"use client";

import { createElement } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import type { CartLine } from "@/lib/cart-types";

/** Adds a line and gives consistent feedback: either open the drawer or show a toast with a shortcut. */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  return (line: Omit<CartLine, "quantity">, quantity = 1, opts: { openDrawer?: boolean } = {}) => {
    const existing = useCart.getState().lines.find((l) => l.variantId === line.variantId);
    if (existing && existing.quantity >= line.stock) {
      toast.error("That’s all we have", { description: `Only ${line.stock} available in this option.` });
      return false;
    }
    add(line, quantity);
    if (opts.openDrawer) {
      setOpen(true);
    } else {
      toast.success("Added to your bag", {
        description: createElement("span", null, line.name, line.variantLabel ? ` · ${line.variantLabel}` : ""),
        action: { label: "View bag", onClick: () => setOpen(true) },
      });
    }
    return true;
  };
}
