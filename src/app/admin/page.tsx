import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status";
import { CategoryChart, RevenueChart } from "@/components/admin/charts";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { getDashboardData } from "@/lib/analytics";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Overview" };

const statusOrder = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const statusLabel: Record<(typeof statusOrder)[number], string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AdminOverview() {
  const d = await getDashboardData(30);
  const maxProduct = Math.max(1, ...d.topProducts.map((p) => p.revenue));
  const totalStatus = Math.max(1, Object.values(d.statusCounts).reduce((a, b) => a + b, 0));

  return (
    <>
      <AdminPageHeader title="Overview" description={`Performance over the last ${d.days} days`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(d.kpis.revenue.value)} delta={d.kpis.revenue.delta} />
        <StatCard label="Paid orders" value={String(d.kpis.orders.value)} delta={d.kpis.orders.delta} />
        <StatCard label="Average order value" value={formatPrice(d.kpis.aov.value)} delta={d.kpis.aov.delta} />
        <StatCard label="Customers" value={String(d.kpis.customers.value)} delta={d.kpis.customers.delta} note={`${d.kpis.customers.newInRange} new this period`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border bg-card p-5 sm:p-6 xl:col-span-2">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-medium">Revenue</h2>
            <p className="text-[13px] text-muted-foreground">
              Daily, paid orders only
              {d.awaitingPayment.count > 0 && (
                <>
                  {" · "}
                  {formatPrice(d.awaitingPayment.value)} awaiting payment ({d.awaitingPayment.count})
                </>
              )}
            </p>
          </div>
          <RevenueChart data={d.daily} />
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-medium">Orders by status</h2>
          <ul className="mt-6 space-y-4">
            {statusOrder.map((s) => {
              const count = d.statusCounts[s] ?? 0;
              return (
                <li key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{statusLabel[s]}</span>
                    <span className="tabular-nums text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(count / totalStatus) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/admin/orders" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
            Manage orders <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-medium">Top products</h2>
          <ol className="mt-6 space-y-5">
            {d.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-4">
                <span className="w-4 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="tabular-nums">{formatPrice(p.revenue)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${(p.revenue / maxProduct) * 100}%` }} />
                    </div>
                    <span className="w-14 text-right text-[12px] tabular-nums text-muted-foreground">{p.units} sold</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="mb-6 font-medium">Revenue by category</h2>
          <CategoryChart data={d.categories} />
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border bg-card xl:col-span-2">
          <div className="flex items-center justify-between p-5 sm:p-6">
            <h2 className="font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-background/50 text-left text-[12px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-6">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.recent.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link href={`/admin/orders/${o.number}`} className="font-mono text-[13px] hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">{o.user.name}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-3.5">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums sm:px-6">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-warning" /> Low stock
          </h2>
          {d.lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Everything is well stocked.</p>
          ) : (
            <ul className="mt-5 divide-y">
              {d.lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link href={`/admin/products/${v.product.id}`} className="min-w-0 hover:underline">
                    <span className="block truncate">{v.product.name}</span>
                    <span className="block text-[12px] text-muted-foreground">{[v.color, v.size].filter(Boolean).join(" / ") || v.sku}</span>
                  </Link>
                  <span className={v.stock === 0 ? "text-[12px] font-medium text-destructive" : "text-[12px] font-medium text-warning"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
