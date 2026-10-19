import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background-color,color,box-shadow,transform,opacity] duration-300 ease-[var(--ease-out-expo)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/88 shadow-soft",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft",
        outline: "border border-foreground/15 bg-transparent hover:border-foreground/40 hover:bg-foreground/[0.03]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-foreground/[0.06]",
        glass: "glass border border-white/20 text-foreground hover:bg-background/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "rounded-none px-0 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        default: "h-11 px-6",
        lg: "h-13 px-8 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
