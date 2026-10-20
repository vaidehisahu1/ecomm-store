"use client";

import { motion } from "framer-motion";

export function SuccessMark() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="mx-auto grid size-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-lift"
    >
      <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }} />
      </svg>
    </motion.div>
  );
}

export function PendingMark({ cancelled = false }: { cancelled?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="mx-auto grid size-20 place-items-center rounded-full border-2 border-foreground/15 text-muted-foreground"
      aria-hidden
    >
      {cancelled ? (
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      ) : (
        <span className="size-7 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
    </motion.div>
  );
}
