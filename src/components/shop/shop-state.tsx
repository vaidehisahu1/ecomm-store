"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type ShopState = {
  pending: boolean;
  /** Merges updates into the current URL params. `null` removes a key. Resets pagination. */
  update: (updates: Record<string, string | null>) => void;
  params: URLSearchParams;
};

const Ctx = createContext<ShopState | null>(null);

export function ShopStateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  return <Ctx.Provider value={{ pending, update, params: new URLSearchParams(searchParams.toString()) }}>{children}</Ctx.Provider>;
}

export function useShopState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShopState must be used inside ShopStateProvider");
  return ctx;
}

/** Dims the results while a filter change is in flight. */
export function PendingResults({ children }: { children: React.ReactNode }) {
  const { pending } = useShopState();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-45")}>
      {children}
    </div>
  );
}
