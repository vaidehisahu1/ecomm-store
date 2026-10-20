import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isOrderNumberCollision, withUniqueOrderNumber } from "@/lib/checkout/order-number";

vi.mock("@/lib/db", () => ({ db: {} }));
const { cancelAndRestock, changeOrderStatus, STALE_STATUS_ERROR } = await import("@/lib/orders");

function makeDb() {
  const m = {
    order: { updateMany: vi.fn() },
    orderItem: { findMany: vi.fn().mockResolvedValue([{ variantId: "v1", productId: "p1", quantity: 2 }]) },
    variant: { update: vi.fn() },
    product: { update: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(m)),
  };
  return m;
}
let m: ReturnType<typeof makeDb>;
const client = () => m as unknown as Parameters<typeof changeOrderStatus>[0];
const tx = () => m as unknown as Prisma.TransactionClient;
beforeEach(() => {
  m = makeDb();
});

describe("cancelAndRestock", () => {
  it("claims the order with a status guard, then restocks", async () => {
    m.order.updateMany.mockResolvedValue({ count: 1 });
    expect(await cancelAndRestock(tx(), "o1", "PAID")).toBe(true);
    expect(m.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: "PAID" }, data: { status: "CANCELLED" } });
    expect(m.variant.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { stock: { increment: 2 } } });
    expect(m.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { salesCount: { decrement: 2 } } });
  });

  it("restocks nothing if the order already moved (no double restock under concurrent cancels)", async () => {
    m.order.updateMany.mockResolvedValue({ count: 0 });
    expect(await cancelAndRestock(tx(), "o1", "PENDING")).toBe(false);
    expect(m.orderItem.findMany).not.toHaveBeenCalled();
    expect(m.variant.update).not.toHaveBeenCalled();
  });
});

describe("changeOrderStatus", () => {
  it("applies a valid transition only if the order is still in the expected status", async () => {
    m.order.updateMany.mockResolvedValue({ count: 1 });
    expect(await changeOrderStatus(client(), "o1", "PAID", "SHIPPED")).toEqual({ ok: true });
    expect(m.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: "PAID" }, data: { status: "SHIPPED" } });
  });

  it("returns a clear error when someone else changed the order first", async () => {
    m.order.updateMany.mockResolvedValue({ count: 0 });
    expect(await changeOrderStatus(client(), "o1", "PAID", "SHIPPED")).toEqual({ ok: false, error: STALE_STATUS_ERROR });
  });

  it("routes cancellation through the guarded restock in a transaction", async () => {
    m.order.updateMany.mockResolvedValue({ count: 0 });
    expect(await changeOrderStatus(client(), "o1", "PENDING", "CANCELLED")).toEqual({ ok: false, error: STALE_STATUS_ERROR });
    expect(m.$transaction).toHaveBeenCalledTimes(1);
    expect(m.variant.update).not.toHaveBeenCalled();
  });

  it("rejects invalid transitions without writing", async () => {
    const r = await changeOrderStatus(client(), "o1", "SHIPPED", "CANCELLED");
    expect(r).toEqual({ ok: false, error: "A shipped order can only move to delivered." });
    expect((await changeOrderStatus(client(), "o1", "DELIVERED", "PAID")).ok).toBe(false);
    expect(m.order.updateMany).not.toHaveBeenCalled();
  });

  it("treats a no-op change as success without writing", async () => {
    expect(await changeOrderStatus(client(), "o1", "PAID", "PAID")).toEqual({ ok: true });
    expect(m.order.updateMany).not.toHaveBeenCalled();
  });
});

const collision = (target: unknown = ["number"]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6.19.3", meta: { target } });

describe("withUniqueOrderNumber", () => {
  it("recognises only unique violations on Order.number", () => {
    expect(isOrderNumberCollision(collision())).toBe(true);
    expect(isOrderNumberCollision(collision("Order_number_key"))).toBe(true);
    expect(isOrderNumberCollision(collision(["email"]))).toBe(false);
    expect(isOrderNumberCollision(new Error("P2002"))).toBe(false);
  });

  it("retries with a new number after a collision", async () => {
    const numbers = ["HL-1", "HL-2"];
    const attempt = vi.fn().mockRejectedValueOnce(collision()).mockResolvedValueOnce("order");
    expect(await withUniqueOrderNumber(attempt, () => numbers.shift()!)).toBe("order");
    expect(attempt.mock.calls.map((c) => c[0])).toEqual(["HL-1", "HL-2"]);
  });

  it("gives up after 5 attempts", async () => {
    const attempt = vi.fn().mockRejectedValue(collision());
    await expect(withUniqueOrderNumber(attempt)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(attempt).toHaveBeenCalledTimes(5);
  });

  it("does not retry other errors (e.g. out of stock)", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("sold out"));
    await expect(withUniqueOrderNumber(attempt)).rejects.toThrow("sold out");
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("generates HL- numbers with six digits", async () => {
    const seen = await withUniqueOrderNumber(async (n) => n);
    expect(seen).toMatch(/^HL-\d{6}$/);
  });
});
