"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({ className, thumbLabels = [], ...props }: React.ComponentProps<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }) {
  const count = (props.value ?? props.defaultValue ?? [0]).length;
  return (
    <SliderPrimitive.Root className={cn("relative flex w-full touch-none select-none items-center py-2", className)} {...props}>
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-foreground/12">
        <SliderPrimitive.Range className="absolute h-full bg-foreground" />
      </SliderPrimitive.Track>
      {Array.from({ length: count }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbLabels[i]}
          className="block size-5 rounded-full border-2 border-foreground bg-background shadow-soft transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
