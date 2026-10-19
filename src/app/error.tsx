"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";
import { Logo, LogoIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="container-page flex h-20 items-center">
        <Link href="/" aria-label="Halden home">
          <Logo className="h-[18px]" />
        </Link>
      </header>
      <div className="container-page relative flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-display text-[clamp(14rem,40vw,34rem)] leading-none text-foreground/[0.04]">
            500
          </span>
        </div>
        <LogoIcon className="relative size-12 text-accent" />
        <p className="eyebrow relative mt-8 text-muted-foreground">Something went wrong</p>
        <h1 className="relative mt-4 max-w-2xl font-display text-display-lg">
          An unexpected <em>interruption</em>.
        </h1>
        <p className="relative mt-5 max-w-md text-muted-foreground">
          We encountered an error loading this view. You can try refreshing or returning home.
        </p>
        {error?.digest && (
          <p className="relative mt-4 rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
            Digest: {error.digest}
          </p>
        )}
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => reset()}>
            <RotateCw /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <ArrowLeft /> Back home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
