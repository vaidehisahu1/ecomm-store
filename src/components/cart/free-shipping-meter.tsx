"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";

export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-2 text-[13px]">
        <Truck className="size-4 text-accent" />
        {remaining > 0 ? (
          <span>
            You’re <strong className="font-semibold">{formatPrice(remaining)}</strong> away from free standard shipping
          </span>
        ) : (
          <span>You’ve unlocked complimentary shipping.</span>
        )}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progress to free shipping">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
