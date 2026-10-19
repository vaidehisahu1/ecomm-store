"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

const sideClasses = {
  right:
    "inset-y-0 right-0 h-full w-full sm:max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-[88%] max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
} as const;

function SheetContent({
  side = "right",
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof sideClasses; hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-300" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-float outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-500 data-[state=closed]:duration-300 ease-[var(--ease-out-expo)]",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full transition hover:bg-foreground/[0.06]">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription };
