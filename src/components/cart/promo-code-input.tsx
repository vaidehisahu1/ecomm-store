"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { validatePromo } from "@/actions/checkout";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import { cn, formatPrice } from "@/lib/utils";

export function PromoCodeInput() {
  const promo = useCart((s) => s.promo);
  const setPromo = useCart((s) => s.setPromo);
  const subtotal = useCart((s) => cartSubtotal(s.lines));
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await validatePromo({ code, subtotal });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPromo(res.promo);
      setCode("");
      setOpen(false);
      toast.success(`${res.promo.code} applied`, { description: res.promo.description });
    });
  }

  if (promo) {
    const belowMin = subtotal < promo.minSubtotal;
    return (
      <div className={cn("flex items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3", belowMin ? "border-warning/50" : "border-accent/40 bg-accent-soft/50")}>
        <div className="flex items-center gap-2.5 text-sm">
          <Tag className="size-4 text-accent" />
          <div>
            <p className="font-medium tracking-wide">{promo.code}</p>
            <p className="text-[12px] text-muted-foreground">
              {belowMin ? `Add ${formatPrice(promo.minSubtotal - subtotal)} more to activate` : promo.description}
            </p>
          </div>
        </div>
        <button onClick={() => setPromo(null)} className="grid size-8 place-items-center rounded-full hover:bg-foreground/[0.06]" aria-label={`Remove promo code ${promo.code}`}>
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm underline-offset-4 hover:underline" aria-expanded={open}>
        <Tag className="size-4" /> Add a promo code
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={apply}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-3">
              <label htmlFor="promo" className="sr-only">
                Promo code
              </label>
              <input
                id="promo"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                autoComplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "promo-error" : undefined}
                className="h-11 min-w-0 flex-1 rounded-full border border-input bg-card px-4 text-sm uppercase tracking-wide outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
              <button type="submit" disabled={pending || !code.trim()} className="h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background transition disabled:opacity-40">
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {error && (
              <p id="promo-error" role="alert" className="pt-2 pl-4 text-[13px] text-destructive">
                {error}
              </p>
            )}
            <p className="pt-2 pl-4 text-[12px] text-muted-foreground">Try WELCOME10, TAKE25, HALDEN20 or FREESHIP.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
