"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/messages", label: "Messages", icon: Inbox, badge: unread },
  ];
  return (
    <nav aria-label="Admin">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                  active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", active ? "bg-background/20" : "bg-accent text-accent-foreground")}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
