"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/lib/cart-store";
import { initials } from "@/lib/utils";

export type SessionUser = { name: string; email: string; role: "ADMIN" | "CUSTOMER" };

export function UserMenu({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/login" aria-label="Sign in">
          <User className="size-[18px]" />
        </Link>
      </Button>
    );
  }

  function signOut() {
    startTransition(async () => {
      // The saved cart lives on in the database; only the local copy is cleared.
      useCart.getState().setUser(null);
      useCart.getState().clear();
      await logout();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="grid size-9 place-items-center rounded-full bg-foreground text-[11px] font-semibold tracking-wide text-background transition hover:opacity-85"
          aria-label="Account menu"
        >
          {initials(user.name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <DropdownMenuItem onSelect={() => router.push("/admin")}>
            <LayoutDashboard /> Admin dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push("/account")}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/account/orders")}>
          <Package /> Orders
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/account/addresses")}>
          <MapPin /> Addresses
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/account/wishlist")}>
          <Heart /> Wishlist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} disabled={pending}>
          <LogOut /> {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
