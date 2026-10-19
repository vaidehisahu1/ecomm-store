"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { NavCategory } from "@/components/layout/header";
import type { SessionUser } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ categories, user }: { categories: NavCategory[]; user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const secondary = [
    { label: "New in", href: "/shop?sort=newest" },
    { label: "Our story", href: "/about" },
    { label: "Help & FAQ", href: "/faq" },
    { label: "Shipping & returns", href: "/shipping-returns" },
    { label: "Contact", href: "/contact" },
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <div className="flex h-16 items-center px-6">
          <Logo className="h-[18px]" />
        </div>
        <nav aria-label="Mobile" className="flex flex-1 flex-col px-6 pb-8">
          <p className="eyebrow mt-4 text-muted-foreground">Shop</p>
          <ul className="mt-3">
            {[{ name: "Shop all", slug: "" }, ...categories].map((c, i) => (
              <motion.li key={c.slug || "all"} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i + 0.1 }}>
                <Link href={c.slug ? `/shop?category=${c.slug}` : "/shop"} onClick={close} className="block py-2 font-display text-[28px] leading-tight">
                  {c.name}
                </Link>
              </motion.li>
            ))}
          </ul>
          <ul className="mt-8 space-y-3 border-t pt-6">
            {secondary.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="text-[15px] text-foreground/80">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center justify-between border-t pt-6">
            {user ? (
              <Link href="/account" onClick={close} className="text-[15px] font-medium">
                {user.name.split(" ")[0]}’s account
              </Link>
            ) : (
              <Link href="/login" onClick={close} className="text-[15px] font-medium">
                Sign in / Create account
              </Link>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
