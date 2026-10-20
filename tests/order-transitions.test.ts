import type { OrderStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
const { canTransition, nextStatuses } = await import("@/lib/orders");

const ALL: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const allowed: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

describe("order status transitions", () => {
  it.each(ALL.flatMap((from) => ALL.map((to) => [from, to] as const)))("%s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(allowed[from].includes(to));
  });

  it("never allows a no-op transition", () => {
    for (const s of ALL) expect(canTransition(s, s)).toBe(false);
  });

  it("treats DELIVERED and CANCELLED as final", () => {
    expect(nextStatuses("DELIVERED")).toEqual([]);
    expect(nextStatuses("CANCELLED")).toEqual([]);
  });

  it("does not allow shipped orders to be cancelled (stock has left the building)", () => {
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });
});
