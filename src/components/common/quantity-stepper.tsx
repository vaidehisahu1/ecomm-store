"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  size = "default",
  label = "Quantity",
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  size?: "sm" | "default";
  label?: string;
}) {
  const btn = cn(
    "grid place-items-center rounded-full transition hover:bg-foreground/[0.07] disabled:opacity-30 disabled:hover:bg-transparent",
    size === "sm" ? "size-7" : "size-10",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center rounded-full border bg-card", size === "sm" ? "h-9 px-1" : "h-12 px-1")}
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-3.5" />
      </button>
      <span aria-live="polite" className={cn("text-center tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")}>
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
