"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

const RadioGroup = RadioGroupPrimitive.Root;

/** A selectable card — the whole surface is the radio. */
function RadioCard({ className, children, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-lg border bg-card p-5 text-left transition-all duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 data-[state=checked]:border-foreground data-[state=checked]:shadow-soft",
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-foreground/30 transition group-data-[state=checked]:border-foreground">
        <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-foreground animate-in zoom-in-50" />
      </span>
      {children}
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioCard };
