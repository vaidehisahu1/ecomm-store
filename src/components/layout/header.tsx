"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ChevronDown, Heart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CartButton } from "@/components/cart/cart-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu, type SessionUser } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavCategory = { name: string; slug: string; image: string; description: string };

export function Header({ user, categories }: { user: SessionUser | null; categories: NavCategory[] }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // Hide on scroll down, reveal on scroll up — keeps product imagery unobstructed.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (megaOpen) return;
    setHidden(y > 240 && y > prev);
  });

  useEffect(() => setMegaOpen(false), [pathname]);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 120);
  };

  const navLink = "relative px-3 py-2 text-[14px] text-foreground/80 transition-colors hover:text-foreground";

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-500",
        scrolled || megaOpen ? "glass border-border/70" : "border-transparent bg-background",
      )}
      onMouseLeave={closeMega}
    >
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-[72px]">
        <nav aria-label="Primary" className="flex items-center">
          <MobileNav categories={categories} user={user} />
          <ul className="hidden items-center lg:flex">
            <li>
              <button
                className={cn(navLink, "inline-flex items-center gap-1")}
                aria-expanded={megaOpen}
                aria-controls="mega-menu"
                onMouseEnter={openMega}
                onFocus={openMega}
                onClick={() => setMegaOpen((o) => !o)}
              >
                Shop <ChevronDown className={cn("size-3.5 transition-transform duration-300", megaOpen && "rotate-180")} />
              </button>
            </li>
            <li>
              <Link href="/shop?sort=newest" className={navLink} onMouseEnter={closeMega}>
                New in
              </Link>
            </li>
            <li>
              <Link href="/about" className={navLink} onMouseEnter={closeMega}>
                Our story
              </Link>
            </li>
            <li>
              <Link href="/faq" className={navLink} onMouseEnter={closeMega}>
                Help
              </Link>
            </li>
          </ul>
        </nav>

        <Link href="/" aria-label="Halden home" className="justify-self-center">
          <Logo className="h-[18px] lg:h-5" />
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <SearchDialog />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
            <Link href="/account/wishlist" aria-label="Wishlist">
              <Heart className="size-[18px]" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <UserMenu user={user} />
          </div>
          <CartButton />
        </div>
      </div>

      <AnimatePresence>
        {megaOpen && (
          <motion.div
            id="mega-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
            className="absolute inset-x-0 top-full hidden border-b glass lg:block"
          >
            <div className="container-page grid grid-cols-12 gap-10 py-10">
              <div className="col-span-3">
                <p className="eyebrow text-muted-foreground">Shop by category</p>
                <ul className="mt-5 space-y-1">
                  {categories.map((c, i) => (
                    <motion.li key={c.slug} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.03 * i }}>
                      <Link
                        href={`/shop?category=${c.slug}`}
                        className="group flex items-center justify-between py-1.5 font-display text-2xl transition-colors hover:text-accent"
                      >
                        {c.name}
                        <ArrowRight className="size-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
                <Link href="/shop" className="mt-6 inline-flex items-center gap-2 text-sm font-medium link-underline">
                  Shop everything <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-5">
                {categories.slice(0, 3).map((c) => (
                  <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="25vw"
                      className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                    <div className="absolute inset-x-5 bottom-4 text-white">
                      <p className="font-display text-2xl">{c.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-white/75">{c.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
