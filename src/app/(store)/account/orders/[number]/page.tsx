import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderStatusBadge, OrderTracker } from "@/components/account/order-status";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { deliveryOptions } from "@/lib/pricing";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${(await params).number}`, robots: { index: false } };
}

export default async function OrderDetailPage({ params }: Props) {
  const { number } = await params;
  const user = await requireUser();
  const order = await db.order.findUnique({ where: { number }, include: { items: { include: { product: { select: { slug: true } } } } } });
  if (!order || order.userId !== user.id) notFound();

  return (
    <div className="space-y-8">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl">Order {order.number}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDate(order.createdAt, { dateStyle: "full" })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="rounded-2xl border bg-card p-6 sm:p-8" aria-label="Tracking">
        <OrderTracker status={order.status} createdAt={order.createdAt} />
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <ul className="divide-y px-6 sm:px-8">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-5">
              <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <div className="flex-1 text-sm">
                {item.product ? (
                  <Link href={`/product/${item.product.slug}`} className="font-medium hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  <p className="font-medium">{item.name}</p>
                )}
                <p className="text-muted-foreground">{item.variant}</p>
                <p className="mt-1 text-muted-foreground tabular-nums">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <p className="text-sm tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="grid gap-8 border-t px-6 py-6 sm:grid-cols-3 sm:px-8">
          <div className="text-sm">
            <p className="eyebrow text-muted-foreground">Shipping address</p>
            <p className="mt-3 leading-relaxed">
              {order.shipName}
              <br />
              {order.shipLine1}
              {order.shipLine2 && <>, {order.shipLine2}</>}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPostalCode}
              <br />
              {order.shipCountry}
            </p>
          </div>
          <div className="text-sm">
            <p className="eyebrow text-muted-foreground">Delivery & payment</p>
            <p className="mt-3 leading-relaxed">
              {deliveryOptions[order.deliveryMethod].label} · {deliveryOptions[order.deliveryMethod].eta}
              <br />
              {order.paymentProvider === "stripe" ? "Stripe" : "Card"}
              {order.cardLast4 && <> •••• {order.cardLast4}</>}
            </p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="tabular-nums text-accent">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
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
        </div>
      </section>
      <p className="text-sm text-muted-foreground">
        Need help with this order? <Link href="/contact" className="text-foreground underline underline-offset-4">Contact our team</Link> and quote {order.number}.
      </p>
    </div>
  );
}
