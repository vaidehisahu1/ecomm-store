import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const [user, orderCount, wishlistCount, latest] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    db.order.count({ where: { userId: sessionUser.id } }),
    db.wishlistItem.count({ where: { userId: sessionUser.id } }),
    db.order.findFirst({ where: { userId: sessionUser.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-12">
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border bg-border">
        {[
          ["Orders", orderCount],
          ["Saved items", wishlistCount],
          ["Member since", formatDate(user.createdAt, { month: "short", year: "numeric" })],
        ].map(([label, value]) => (
          <div key={label} className="bg-card p-5 sm:p-6">
            <dt className="text-[13px] text-muted-foreground">{label}</dt>
            <dd className="mt-2 font-display text-3xl sm:text-4xl">{value}</dd>
          </div>
        ))}
      </dl>

      {latest && (
        <Link href={`/account/orders/${latest.number}`} className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 transition hover:border-foreground/30">
          <div>
            <p className="text-[13px] text-muted-foreground">Latest order · {formatDate(latest.createdAt)}</p>
            <p className="mt-1 flex flex-wrap items-center gap-3 font-medium">
              {latest.number} <OrderStatusBadge status={latest.status} />
            </p>
          </div>
          <span className="flex items-center gap-2 text-sm">
            {formatPrice(latest.total)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      )}

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="font-display text-3xl">Personal details</h2>
        <div className="mt-6">
          <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="font-display text-3xl">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use at least 8 characters with upper and lowercase letters and a number.</p>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
