import "server-only";
import { db } from "@/lib/db";

const DAY = 86400000;

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function getDashboardData(days = 30) {
  const today = startOfDay(new Date());
  const from = new Date(today.getTime() - (days - 1) * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [orders, prevOrders, statusCounts, customers, newCustomers, prevNewCustomers, recent, lowStock] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: from }, status: { not: "CANCELLED" } },
      select: {
        total: true,
        createdAt: true,
        items: { select: { productId: true, name: true, image: true, quantity: true, unitPrice: true, product: { select: { slug: true, category: { select: { name: true } } } } } },
      },
    }),
    db.order.aggregate({ where: { createdAt: { gte: prevFrom, lt: from }, status: { not: "CANCELLED" } }, _sum: { total: true }, _count: true }),
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

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevOrders._sum.total ?? 0;

  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(from.getTime() + i * DAY);
    return { date: dayKey(date), revenue: 0, orders: 0 };
  });
  const byDay = new Map(daily.map((d) => [d.date, d]));
  for (const o of orders) {
    const bucket = byDay.get(dayKey(o.createdAt));
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }

  const products = new Map<string, { name: string; image: string; slug: string | null; units: number; revenue: number }>();
  const categories = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.productId ?? item.name;
      const p = products.get(key) ?? { name: item.name, image: item.image, slug: item.product?.slug ?? null, units: 0, revenue: 0 };
      p.units += item.quantity;
      p.revenue += item.quantity * item.unitPrice;
      products.set(key, p);
      const cat = item.product?.category.name ?? "Archived";
      categories.set(cat, (categories.get(cat) ?? 0) + item.quantity * item.unitPrice);
    }
  }

  const delta = (now: number, prev: number) => (prev === 0 ? null : (now - prev) / prev);

  return {
    days,
    kpis: {
      revenue: { value: revenue, delta: delta(revenue, prevRevenue) },
      orders: { value: orders.length, delta: delta(orders.length, prevOrders._count) },
      aov: { value: orders.length ? Math.round(revenue / orders.length) : 0, delta: delta(orders.length ? revenue / orders.length : 0, prevOrders._count ? prevRevenue / prevOrders._count : 0) },
      customers: { value: customers, newInRange: newCustomers, delta: delta(newCustomers, prevNewCustomers) },
    },
    daily,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    categories: [...categories].map(([name, value]) => ({ name, revenue: value })).sort((a, b) => b.revenue - a.revenue),
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Record<string, number>,
    recent,
    lowStock,
  };
}
