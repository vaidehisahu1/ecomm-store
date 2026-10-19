import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/logo";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Halden Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/account");
  const unread = await db.contactMessage.count({ where: { isRead: false } });

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card/50 p-5 lg:flex">
        <Link href="/admin" className="mb-10 mt-2 flex items-center gap-2.5 px-3">
          <Logo className="h-4" />
          <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">Admin</span>
        </Link>
        <AdminNav unread={unread} />
        <Link href="/" className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground">
          View storefront <ArrowUpRight className="size-4" />
        </Link>
      </aside>
      <div className="min-w-0">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-5 lg:px-10">
          <div className="flex items-center gap-2">
            <AdminMobileNav unread={unread} />
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{session.user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={{ name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role }} />
          </div>
        </header>
        <main id="main" className="px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
