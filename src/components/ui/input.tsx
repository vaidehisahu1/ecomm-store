import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "flex h-12 w-full rounded-md border border-input bg-card px-4 text-[15px] text-foreground shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(inputClasses, "h-auto min-h-32 py-3 leading-relaxed", className)} {...props} />;
}

export { Input, Textarea };
