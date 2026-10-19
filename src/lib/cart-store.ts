"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setCartLine } from "@/actions/cart";
import { MAX_PER_LINE, type AppliedPromo, type CartLine } from "@/lib/cart-types";

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  /** Signed-in user id; when set, every change is mirrored to the database. */
  userId: string | null;
  promo: AppliedPromo | null;
  setPromo: (promo: AppliedPromo | null) => void;
  setOpen: (open: boolean) => void;
  setUser: (userId: string | null) => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
};

function persistLine(userId: string | null, variantId: string, quantity: number) {
  if (userId) void setCartLine({ variantId, quantity });
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      userId: null,
      promo: null,
      setPromo: (promo) => set({ promo }),
      setOpen: (isOpen) => set({ isOpen }),
      setUser: (userId) => set({ userId }),
      add: (line, quantity = 1) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        const cap = Math.min(line.stock, MAX_PER_LINE);
        const next = Math.min((existing?.quantity ?? 0) + quantity, cap);
        set({
          lines: existing
            ? get().lines.map((l) => (l.variantId === line.variantId ? { ...l, ...line, quantity: next } : l))
            : [...get().lines, { ...line, quantity: next }],
        });
        persistLine(get().userId, line.variantId, next);
      },
      setQuantity: (variantId, quantity) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        if (!line) return;
        const next = Math.max(1, Math.min(quantity, line.stock, MAX_PER_LINE));
        set({ lines: get().lines.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l)) });
        persistLine(get().userId, variantId, next);
      },
      remove: (variantId) => {
        set({ lines: get().lines.filter((l) => l.variantId !== variantId) });
        persistLine(get().userId, variantId, 0);
      },
      replace: (lines) => set({ lines }),
      clear: () => set({ lines: [], promo: null }),
    }),
    {
      name: "halden-cart",
      partialize: (s) => ({ lines: s.lines, promo: s.promo }),
      skipHydration: true,
    },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.price * l.quantity, 0);
}
