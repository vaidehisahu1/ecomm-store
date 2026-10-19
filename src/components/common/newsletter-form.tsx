"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribe } from "@/actions/newsletter";
import { cn } from "@/lib/utils";

export function NewsletterForm({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const [state, action, pending] = useActionState(subscribe, undefined);
  const inverse = tone === "inverse";
  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {state?.ok ? (
          <motion.p
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-14 items-center gap-3 text-[15px]"
            role="status"
          >
            <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-4" />
            </span>
            You’re on the list. Watch your inbox for 10% off.
          </motion.p>
        ) : (
          <motion.form key="form" action={action} exit={{ opacity: 0, y: -8 }} noValidate>
            <label htmlFor={`newsletter-${tone}`} className="sr-only">
              Email address
            </label>
            <div
              className={cn(
                "flex h-14 items-center rounded-full border p-1.5 pl-5 transition focus-within:ring-4",
                inverse
                  ? "border-white/25 bg-white/10 focus-within:border-white/60 focus-within:ring-white/10"
                  : "border-input bg-card focus-within:border-ring focus-within:ring-ring/15",
              )}
            >
              <input
                id={`newsletter-${tone}`}
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Your email address"
                aria-invalid={Boolean(state?.error)}
                aria-describedby={state?.error ? `newsletter-${tone}-error` : undefined}
                className={cn("min-w-0 flex-1 bg-transparent text-[15px] outline-none", inverse ? "placeholder:text-white/55" : "placeholder:text-muted-foreground/70")}
              />
              <button
                type="submit"
                disabled={pending}
                aria-label="Subscribe"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full transition hover:scale-105 active:scale-95",
                  inverse ? "bg-white text-black" : "bg-foreground text-background",
                )}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              </button>
            </div>
            {state?.error && (
              <p id={`newsletter-${tone}-error`} role="alert" className={cn("mt-2 pl-5 text-[13px]", inverse ? "text-white/80" : "text-destructive")}>
                {state.error}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
