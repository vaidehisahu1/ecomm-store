import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Logo, LogoIcon } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="container-page flex h-20 items-center">
        <Link href="/" aria-label="Halden home">
          <Logo className="h-[18px]" />
        </Link>
      </header>
      <div className="container-page relative flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-display text-[clamp(14rem,40vw,34rem)] leading-none text-foreground/[0.04]">404</span>
        </div>
        <LogoIcon className="relative size-12 text-accent" />
        <p className="eyebrow relative mt-8 text-muted-foreground">Page not found</p>
        <h1 className="relative mt-4 max-w-2xl font-display text-display-lg">
          Somewhere <em>in-between</em>.
        </h1>
        <p className="relative mt-5 max-w-md text-muted-foreground">
          The page you’re looking for has moved, sold out, or never existed. Let’s get you back to something good.
        </p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft /> Back home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/shop">
              <Search /> Browse the shop
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
