"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster
        position="bottom-center"
        offset={24}
        toastOptions={{
          classNames: {
            toast:
              "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-float !font-sans !gap-3 !px-4 !py-3.5",
            description: "!text-muted-foreground",
            actionButton: "!bg-foreground !text-background !rounded-full !px-3",
          },
        }}
      />
    </ThemeProvider>
  );
}
