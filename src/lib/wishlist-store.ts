"use client";

import { create } from "zustand";

type WishlistState = {
  ids: Set<string>;
  set: (ids: string[]) => void;
  toggleLocal: (id: string, saved: boolean) => void;
};

export const useWishlist = create<WishlistState>((set) => ({
  ids: new Set(),
  set: (ids) => set({ ids: new Set(ids) }),
  toggleLocal: (id, saved) =>
    set((s) => {
      const ids = new Set(s.ids);
      if (saved) ids.add(id);
      else ids.delete(id);
      return { ids };
    }),
}));
