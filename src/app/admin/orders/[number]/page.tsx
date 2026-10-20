import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { OrderTracker } from "@/components/account/order-status";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { db } from "@/lib/db";
import { nextStatuses } from "@/lib/orders";
import { deliveryOptions } from "@/lib/pricing";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, user: { select: { name: true, email: true, createdAt: true, _count: { select: { orders: true } } } } },
  });
  if (!order) notFound();
  const paymentIssues = await db.stripeEvent.findMany({
    where: { orderId: order.id, outcome: { in: ["needs_manual_refund", "refunded"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
        <div>
          <h1 className="font-display text-4xl lg:text-5xl">{order.number}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{formatDate(order.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <OrderStatusSelect id={order.id} number={order.number} status={order.status} allowed={nextStatuses(order.status)} className="h-11 w-44" />
      </div>

      {paymentIssues.map((e) => (
        <div
          key={e.id}
          role={e.outcome === "needs_manual_refund" ? "alert" : "status"}
          className={
            e.outcome === "needs_manual_refund"
              ? "flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/[0.06] p-5 text-sm"
              : "flex items-start gap-3 rounded-2xl border bg-card p-5 text-sm"
          }
        >
          <AlertTriangle className={e.outcome === "needs_manual_refund" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-muted-foreground"} />
          <div>
            <p className="font-medium">
              {e.outcome === "needs_manual_refund" ? "Needs manual refund in Stripe" : "Payment refunded automatically"}
            </p>
            <p className="mt-1 text-muted-foreground">
              The customer paid after this order was cancelled. {e.detail} · {formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
      ))}

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <OrderTracker status={order.status} createdAt={order.createdAt} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <h2 className="border-b px-5 py-4 font-medium sm:px-6">Items</h2>
          <ul className="divide-y px-5 sm:px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">{item.variant}</p>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
                <p className="w-20 text-right text-sm tabular-nums">{formatPrice(item.quantity * item.unitPrice)}</p>
              </li>
            ))}
          </ul>
          <dl className="ml-auto max-w-xs space-y-2 border-t px-5 py-5 text-sm sm:px-6">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({order.promoCode})</dt>
                <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping ({deliveryOptions[order.deliveryMethod].label})</dt>
              <dd className="tabular-nums">{formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5 text-sm sm:p-6">
            <h2 className="font-medium">Customer</h2>
            <p className="mt-3">{order.user.name}</p>
            <p className="text-muted-foreground">{order.email}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {order.user._count.orders} orders · customer since {formatDate(order.user.createdAt, { month: "short", year: "numeric" })}
            </p>
          </section>
          <section className="rounded-2xl border bg-card p-5 text-sm sm:p-6">
            <h2 className="font-medium">Shipping address</h2>
            <address className="mt-3 not-italic leading-relaxed text-muted-foreground">
              {order.shipName}
              <br />
              {order.shipLine1}
              {order.shipLine2 && <>, {order.shipLine2}</>}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPostalCode}
              <br />
              {order.shipCountry}
              <br />
              {order.shipPhone}
            </address>
          </section>
          <section className="rounded-2xl border bg-card p-5 text-sm sm:p-6">
            <h2 className="font-medium">Payment</h2>
            <p className="mt-3 capitalize text-muted-foreground">
              {order.paymentProvider}
              {order.cardLast4 && ` · card ending ${order.cardLast4}`}
            </p>
            {order.paymentRef && <p className="mt-1 break-all font-mono text-[12px] text-muted-foreground">{order.paymentRef}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
