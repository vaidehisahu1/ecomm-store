"use client";

import { useEffect } from "react";
import { syncCart } from "@/actions/cart";
import { useCart } from "@/lib/cart-store";

/**
 * Hydrates the persisted cart, then reconciles it with the server:
 * on sign-in the local bag is merged into the saved one; for guests prices and stock are refreshed.
 */
export function CartSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useCart.persist.rehydrate();
      const store = useCart.getState();
      store.setUser(userId);
      const lines = await syncCart(store.lines.map(({ variantId, quantity }) => ({ variantId, quantity })));
      if (!cancelled) useCart.getState().replace(lines);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return null;
}
