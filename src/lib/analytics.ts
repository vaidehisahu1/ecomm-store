import "server-only";
import { summarizeOrders } from "@/lib/analytics-core";
import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/order-status";

const DAY = 86400000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function getDashboardData(days = 30) {
  const today = startOfDay(new Date());
  const from = new Date(today.getTime() - (days - 1) * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [orders, prevOrders, statusCounts, customers, newCustomers, prevNewCustomers, recent, lowStock] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: from }, status: { in: [...REVENUE_STATUSES, "PENDING"] } },
      select: {
        total: true,
        status: true,
        createdAt: true,
        items: { select: { productId: true, name: true, image: true, quantity: true, unitPrice: true, product: { select: { slug: true, category: { select: { name: true } } } } } },
      },
    }),
    db.order.aggregate({ where: { createdAt: { gte: prevFrom, lt: from }, status: { in: [...REVENUE_STATUSES] } }, _sum: { total: true }, _count: true }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: from } } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: prevFrom, lt: from } } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } }),
    db.variant.findMany({
      where: { stock: { lte: 3 }, product: { isActive: true } },
      orderBy: { stock: "asc" },
      take: 6,
      include: { product: { select: { id: true, name: true } } },
    }),
  ]);

  const summary = summarizeOrders(orders, from, days);
  const prevRevenue = prevOrders._sum.total ?? 0;
  const delta = (now: number, prev: number) => (prev === 0 ? null : (now - prev) / prev);

  return {
    days,
    kpis: {
      revenue: { value: summary.revenue, delta: delta(summary.revenue, prevRevenue) },
      orders: { value: summary.orderCount, delta: delta(summary.orderCount, prevOrders._count) },
      aov: {
        value: summary.orderCount ? Math.round(summary.revenue / summary.orderCount) : 0,
        delta: delta(summary.orderCount ? summary.revenue / summary.orderCount : 0, prevOrders._count ? prevRevenue / prevOrders._count : 0),
      },
      customers: { value: customers, newInRange: newCustomers, delta: delta(newCustomers, prevNewCustomers) },
    },
    awaitingPayment: summary.awaitingPayment,
    daily: summary.daily,
    topProducts: summary.topProducts,
    categories: summary.categories,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Record<string, number>,
    recent,
    lowStock,
  };
}
