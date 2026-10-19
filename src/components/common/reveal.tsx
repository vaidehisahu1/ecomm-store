"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Fades and lifts children into view once, as they enter the viewport. */
export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    />
  );
}
