"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/** Empties the local bag once an order is confirmed (the server-side cart is cleared at order time). */
export function ClearCart() {
  useEffect(() => {
    const clear = () => useCart.getState().clear();
    if (useCart.persist.hasHydrated()) clear();
    return useCart.persist.onFinishHydration(clear);
  }, []);
  return null;
}
