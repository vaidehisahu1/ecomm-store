import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
        soft: "bg-accent-soft text-accent",
        outline: "border border-foreground/15 text-foreground/80",
        muted: "bg-muted text-muted-foreground",
        glass: "glass text-foreground border border-white/30",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        destructive: "bg-destructive/12 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
