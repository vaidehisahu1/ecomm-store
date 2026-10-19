"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MapPin, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
        {items.map((item) => {
          const active = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="relative shrink-0">
              {active && <motion.span layoutId="account-nav" className="absolute inset-0 rounded-full bg-foreground lg:rounded-lg" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] transition-colors lg:rounded-lg",
                  active ? "text-background" : "text-foreground/75 hover:bg-foreground/[0.05] hover:text-foreground",
                )}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
