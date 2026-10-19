"use client";

import type { DeliveryMethod } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import type { AppliedPromo } from "@/lib/cart-types";
import { computeTotals, deliveryOptions } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";

export function OrderTotals({ subtotal, method, promo, estimate = false }: { subtotal: number; method: DeliveryMethod; promo: AppliedPromo | null; estimate?: boolean }) {
  const t = computeTotals(subtotal, method, promo);
  const row = "flex items-baseline justify-between text-[14px]";
  return (
    <dl className="space-y-3">
      <div className={row}>
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(t.subtotal)}</dd>
      </div>
      <AnimatePresence initial={false}>
        {t.discount > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={row}>
            <dt className="text-muted-foreground">Discount {promo && <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">{promo.code}</span>}</dt>
            <dd className="tabular-nums text-accent">−{formatPrice(t.discount)}</dd>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={row}>
        <dt className="text-muted-foreground">
          {estimate ? "Shipping (est.)" : `Shipping · ${deliveryOptions[method].label}`}
        </dt>
        <dd className="tabular-nums">{t.shipping === 0 ? <span className="text-success">Free</span> : formatPrice(t.shipping)}</dd>
      </div>
      <div className={row}>
        <dt className="text-muted-foreground">{estimate ? "Tax (est.)" : "Tax"}</dt>
        <dd className="tabular-nums">{formatPrice(t.tax)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t pt-4">
        <dt className="font-medium">Total</dt>
        <dd className="text-2xl font-medium tabular-nums">
          <span className="mr-1.5 text-[12px] font-normal text-muted-foreground">USD</span>
          {formatPrice(t.total)}
        </dd>
      </div>
    </dl>
  );
}
