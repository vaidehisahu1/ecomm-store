import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TableSearch } from "@/components/admin/table-search";
import { db } from "@/lib/db";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { orderStatusSchema } from "@/lib/validators";

export const metadata = { title: "Orders" };

const PER_PAGE = 20;
const tabs: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = orderStatusSchema.safeParse(sp.status).data;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(sp.q && { OR: [{ number: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { shipName: { contains: sp.q, mode: "insensitive" } }] }),
  };
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { _count: { select: { items: true } } } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (s: OrderStatus | "") => (s ? (counts.find((c) => c.status === s)?._count ?? 0) : counts.reduce((a, c) => a + c._count, 0));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (next: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries({ status: sp.status, q: sp.q, ...next }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/admin/orders${qs.size ? `?${qs}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader title="Orders" description={`${total} ${status ? status.toLowerCase() : ""} orders`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={href({ status: t.value || undefined, page: undefined })}
              aria-current={(status ?? "") === t.value ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition",
                (status ?? "") === t.value ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40",
              )}
            >
              {t.label} <span className="tabular-nums opacity-60">{countFor(t.value)}</span>
            </Link>
          ))}
        </nav>
        <TableSearch placeholder="Search number, email or name" />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b bg-background/50 text-left text-[12px] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-foreground/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.number}`} className="font-mono text-[13px] font-medium hover:underline">
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="block">{o.shipName}</span>
                    <span className="block text-[12px] text-muted-foreground">{o.email}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(o.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-3 py-3 tabular-nums">{o._count.items}</td>
                  <td className="px-3 py-3 text-muted-foreground capitalize">
                    {o.paymentProvider}
                    {o.cardLast4 && ` ·· ${o.cardLast4}`}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3">
                    <OrderStatusSelect id={o.id} number={o.number} status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: String(page - 1) })} className="rounded-full border px-4 py-1.5 hover:border-foreground/40">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href({ page: String(page + 1) })} className="rounded-full border px-4 py-1.5 hover:border-foreground/40">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
