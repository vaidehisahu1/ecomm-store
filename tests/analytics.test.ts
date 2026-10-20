import type { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { dayKey, summarizeOrders, type AnalyticsOrder } from "@/lib/analytics-core";
import { countsAsRevenue, REVENUE_STATUSES } from "@/lib/order-status";

const from = new Date(2026, 9, 1); // local midnight, 1 Oct 2026
const on = (day: number, hour = 12) => new Date(2026, 9, day, hour);

function order(status: OrderStatus, total: number, createdAt = on(2), productId = "p1"): AnalyticsOrder {
  return {
    total,
    status,
    createdAt,
    items: [{ productId, name: `Product ${productId}`, image: "", quantity: 1, unitPrice: total, product: { slug: productId, category: { name: "Bags" } } }],
  };
}

describe("revenue statuses", () => {
  it("counts only PAID, SHIPPED and DELIVERED", () => {
    expect([...REVENUE_STATUSES]).toEqual(["PAID", "SHIPPED", "DELIVERED"]);
    expect(countsAsRevenue("PENDING")).toBe(false);
    expect(countsAsRevenue("CANCELLED")).toBe(false);
    expect(countsAsRevenue("SHIPPED")).toBe(true);
  });
});

describe("summarizeOrders", () => {
  const orders = [
    order("PAID", 10_000),
    order("SHIPPED", 20_000),
    order("DELIVERED", 5_000, on(3)),
    order("PENDING", 99_000),
    order("PENDING", 1_000),
    order("CANCELLED", 50_000),
  ];
  const s = summarizeOrders(orders, from, 7);

  it("sums revenue and counts orders from paid statuses only", () => {
    expect(s.revenue).toBe(35_000);
    expect(s.orderCount).toBe(3);
  });

  it("reports pending orders separately as awaiting payment", () => {
    expect(s.awaitingPayment).toEqual({ count: 2, value: 100_000 });
  });

  it("ignores cancelled orders entirely", () => {
    const cancelledOnly = summarizeOrders([order("CANCELLED", 50_000)], from, 7);
    expect(cancelledOnly).toMatchObject({ revenue: 0, orderCount: 0, awaitingPayment: { count: 0, value: 0 }, topProducts: [], categories: [] });
  });

  it("buckets daily revenue by local day, excluding unpaid orders", () => {
    expect(s.daily).toHaveLength(7);
    expect(s.daily.find((d) => d.date === dayKey(on(2)))).toEqual({ date: dayKey(on(2)), revenue: 30_000, orders: 2 });
    expect(s.daily.find((d) => d.date === dayKey(on(3)))?.revenue).toBe(5_000);
  });

  it("ranks top products and categories from paid line items only", () => {
    const mixed = summarizeOrders([order("PAID", 3_000, on(2), "a"), order("PENDING", 90_000, on(2), "b"), order("DELIVERED", 7_000, on(2), "c")], from, 7);
    expect(mixed.topProducts.map((p) => p.name)).toEqual(["Product c", "Product a"]);
    expect(mixed.categories).toEqual([{ name: "Bags", revenue: 10_000 }]);
  });
});
