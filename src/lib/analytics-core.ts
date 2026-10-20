import type { OrderStatus } from "@prisma/client";
import { countsAsRevenue } from "@/lib/order-status";

const DAY = 86400000;

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type AnalyticsOrder = {
  total: number;
  status: OrderStatus;
  createdAt: Date;
  items: {
    productId: string | null;
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
    product: { slug: string; category: { name: string } } | null;
  }[];
};

/**
 * Pure aggregation for the admin dashboard. Only PAID/SHIPPED/DELIVERED orders count as revenue;
 * PENDING orders are reported separately as "awaiting payment"; everything else is ignored.
 */
export function summarizeOrders(orders: AnalyticsOrder[], from: Date, days: number) {
  const paid = orders.filter((o) => countsAsRevenue(o.status));
  const pending = orders.filter((o) => o.status === "PENDING");

  const daily = Array.from({ length: days }, (_, i) => ({ date: dayKey(new Date(from.getTime() + i * DAY)), revenue: 0, orders: 0 }));
  const byDay = new Map(daily.map((d) => [d.date, d]));
  for (const o of paid) {
    const bucket = byDay.get(dayKey(o.createdAt));
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }

  const products = new Map<string, { name: string; image: string; slug: string | null; units: number; revenue: number }>();
  const categories = new Map<string, number>();
  for (const o of paid) {
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

  return {
    revenue: paid.reduce((s, o) => s + o.total, 0),
    orderCount: paid.length,
    awaitingPayment: { count: pending.length, value: pending.reduce((s, o) => s + o.total, 0) },
    daily,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    categories: [...categories].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
  };
}
