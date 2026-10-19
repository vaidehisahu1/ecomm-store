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
