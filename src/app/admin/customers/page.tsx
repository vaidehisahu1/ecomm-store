import type { Prisma } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TableSearch } from "@/components/admin/table-search";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/order-status";
import { formatDate, formatPrice, initials } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const where: Prisma.UserWhereInput = q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {};
  const paidOnly = { status: { in: [...REVENUE_STATUSES] } };
  const [users, spend, pending] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: { where: paidOnly }, reviews: true } } } }),
    // Lifetime spend counts only orders that were actually paid.
    db.order.groupBy({ by: ["userId"], where: paidOnly, _sum: { total: true }, _max: { createdAt: true } }),
    db.order.groupBy({ by: ["userId"], where: { status: "PENDING" }, _sum: { total: true } }),
  ]);
  const spendBy = new Map(spend.map((s) => [s.userId, s]));
  const pendingBy = new Map(pending.map((p) => [p.userId, p._sum.total ?? 0]));

  return (
    <>
      <AdminPageHeader title="Customers" description={`${users.length} accounts`}>
        <TableSearch placeholder="Search name or email" />
      </AdminPageHeader>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-background/50 text-left text-[12px] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-3 py-3 font-medium">Paid orders</th>
                <th className="px-3 py-3 font-medium">Reviews</th>
                <th className="px-3 py-3 font-medium">Last paid order</th>
                <th className="px-5 py-3 text-right font-medium">Lifetime spend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => {
                const s = spendBy.get(u.id);
                return (
                  <tr key={u.id} className="transition-colors hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">{initials(u.name)}</span>
                        <div>
                          <p className="flex items-center gap-2 font-medium">
                            {u.name} {u.role === "ADMIN" && <Badge variant="soft">Admin</Badge>}
                          </p>
                          <p className="text-[12px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-3 py-3 tabular-nums">{u._count.orders}</td>
                    <td className="px-3 py-3 tabular-nums">{u._count.reviews}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{s?._max.createdAt ? formatDate(s._max.createdAt) : "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatPrice(s?._sum.total ?? 0)}
                      {pendingBy.get(u.id) ? (
                        <span className="block text-[12px] text-muted-foreground">+{formatPrice(pendingBy.get(u.id)!)} awaiting payment</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
