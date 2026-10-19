"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { useCart } from "@/lib/cart-store";
import { MAX_PER_LINE, type CartLine } from "@/lib/cart-types";
import { cn, formatPrice } from "@/lib/utils";

export function CartLineItem({ line, size = "default", onNavigate }: { line: CartLine; size?: "default" | "lg"; onNavigate?: () => void }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const lg = size === "lg";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-4", lg ? "py-8" : "py-5")}
    >
      <Link
        href={`/product/${line.slug}`}
        onClick={onNavigate}
        className={cn("relative shrink-0 overflow-hidden rounded-lg bg-muted", lg ? "h-40 w-32 sm:h-48 sm:w-40" : "h-28 w-22")}
      >
        {line.image && <Image src={line.image} alt={line.name} fill sizes={lg ? "160px" : "88px"} className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} onClick={onNavigate} className={cn("font-medium hover:underline", lg && "text-lg")}>
              {line.name}
            </Link>
            {line.variantLabel && <p className="mt-0.5 text-[13px] text-muted-foreground">{line.variantLabel}</p>}
          </div>
          <p className={cn("tabular-nums", lg && "text-lg")}>{formatPrice(line.price * line.quantity)}</p>
        </div>
        {line.stock <= 3 && <p className="mt-1 text-xs text-warning">Only {line.stock} left</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={Math.min(line.stock, MAX_PER_LINE)}
            onChange={(q) => setQuantity(line.variantId, q)}
            label={`Quantity of ${line.name}`}
          />
          <button
            onClick={() => remove(line.variantId)}
            className="text-[13px] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </motion.li>
  );
}
