import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 4 }, _count: { select: { items: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
        <Package className="size-10 text-muted-foreground" strokeWidth={1.4} />
        <h2 className="mt-6 font-display text-3xl">No orders yet</h2>
        <p className="mt-2 text-muted-foreground">When you place an order, you’ll be able to track it here.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl">Order history</h2>
      <ul className="mt-6 space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/account/orders/${order.number}`} className="group block rounded-2xl border bg-card p-5 transition hover:border-foreground/30 hover:shadow-soft sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex flex-wrap items-center gap-3 font-medium">
                    <span className="font-mono text-sm">{order.number}</span> <OrderStatusBadge status={order.status} />
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {formatDate(order.createdAt, { dateStyle: "long" })} · {order._count.items} {order._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
                <p className="flex items-center gap-2 tabular-nums">
                  {formatPrice(order.total)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
              <div className="mt-5 flex -space-x-3">
                {order.items.map((item) => (
                  <span key={item.id} className="relative size-14 overflow-hidden rounded-lg border-2 border-card bg-muted">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
