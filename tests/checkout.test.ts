import type { PromoCode } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildOrderLines, UNAVAILABLE_ITEM_ERROR } from "@/lib/checkout/lines";
import { commitOrder, type NewOrder } from "@/lib/checkout/order";
import { applyPromo } from "@/lib/checkout/promo";
import { reserveStock, StockError } from "@/lib/checkout/stock";
import type { DbClient, OrderLine, TransactionalDb, VariantWithProduct } from "@/lib/checkout/types";
import { MOCK_DECLINE_CARD, toMockPayment } from "@/lib/payments/mock-card";
import { MockProvider } from "@/lib/payments/mock-provider";
import { computeTotals } from "@/lib/pricing";

vi.mock("@/lib/stripe", () => ({ stripe: null }));
const { isMockAllowed } = await import("@/lib/payments");

/* ── fixtures ──────────────────────────────────────────────────────────── */

function makeVariant(overrides: Partial<VariantWithProduct> = {}, product: Partial<VariantWithProduct["product"]> = {}): VariantWithProduct {
  const base = {
    id: "v-bomber-m",
    sku: "FIEBOM-RUS-M",
    size: "M",
    color: "Rust",
    colorHex: "#a4532f",
    price: null,
    stock: 5,
    productId: "p-bomber",
    product: {
      id: "p-bomber",
      name: "Field Bomber",
      slug: "field-bomber",
      price: 28_500,
      isActive: true,
      images: [{ id: "i1", url: "https://images.unsplash.com/bomber", alt: "", position: 0, productId: "p-bomber" }],
      ...product,
    },
    ...overrides,
  };
  return base as unknown as VariantWithProduct;
}

function makePromo(overrides: Partial<PromoCode> = {}): PromoCode {
  return { id: "promo1", code: "WELCOME10", description: "", type: "PERCENT", value: 10, minSubtotal: 0, isActive: true, expiresAt: null, ...overrides };
}

/** A Prisma stand-in exposing only the delegates checkout touches. */
function makeDb() {
  const mock = {
    variant: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    product: { update: vi.fn() },
    promoCode: { findUnique: vi.fn() },
    order: { create: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    address: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn() },
    // Like Prisma: run the callback with the tx client; a throw rejects (and Prisma would roll back).
    $transaction: vi.fn(async (fn: (tx: DbClient) => Promise<unknown>) => fn(mock as unknown as DbClient)),
  };
  return mock;
}

let db: ReturnType<typeof makeDb>;
const client = () => db as unknown as DbClient;
beforeEach(() => {
  db = makeDb();
});

/* ── buildOrderLines ───────────────────────────────────────────────────── */

describe("buildOrderLines", () => {
  it("prices lines on the server, using variant overrides when present", async () => {
    db.variant.findMany.mockResolvedValue([makeVariant(), makeVariant({ id: "v-xl", size: "XL", price: 30_000 })]);
    const r = await buildOrderLines(client(), [
      { variantId: "v-bomber-m", quantity: 2 },
      { variantId: "v-xl", quantity: 1 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.lines.map((l) => l.unitPrice)).toEqual([28_500, 30_000]);
    expect(r.value.subtotal).toBe(2 * 28_500 + 30_000);
  });

  it("queries each variant once even if it appears twice", async () => {
    db.variant.findMany.mockResolvedValue([makeVariant()]);
    await buildOrderLines(client(), [
      { variantId: "v-bomber-m", quantity: 1 },
      { variantId: "v-bomber-m", quantity: 1 },
    ]);
    expect(db.variant.findMany.mock.calls[0][0].where.id.in).toEqual(["v-bomber-m"]);
  });

  it("rejects the order when a product has been deactivated", async () => {
    db.variant.findMany.mockResolvedValue([makeVariant({}, { isActive: false })]);
    expect(await buildOrderLines(client(), [{ variantId: "v-bomber-m", quantity: 1 }])).toEqual({ ok: false, error: UNAVAILABLE_ITEM_ERROR });
  });

  it("rejects the order when a variant no longer exists", async () => {
    db.variant.findMany.mockResolvedValue([]);
    expect((await buildOrderLines(client(), [{ variantId: "gone", quantity: 1 }])).ok).toBe(false);
  });
});

/* ── applyPromo ────────────────────────────────────────────────────────── */

describe("applyPromo", () => {
  it("is a no-op without a code", async () => {
    expect(await applyPromo(client(), undefined, 10_000)).toEqual({ ok: true, value: null });
    expect(db.promoCode.findUnique).not.toHaveBeenCalled();
  });

  it("returns a valid promo", async () => {
    const promo = makePromo();
    db.promoCode.findUnique.mockResolvedValue(promo);
    expect(await applyPromo(client(), "WELCOME10", 10_000)).toEqual({ ok: true, value: promo });
  });

  it.each([
    ["unknown", null],
    ["inactive", makePromo({ isActive: false })],
    ["expired", makePromo({ expiresAt: new Date("2020-01-01") })],
    ["below its minimum spend", makePromo({ minSubtotal: 25_000 })],
  ])("rejects a code that is %s", async (_case, promo) => {
    db.promoCode.findUnique.mockResolvedValue(promo);
    expect(await applyPromo(client(), "WELCOME10", 10_000)).toEqual({ ok: false, error: "Promo code WELCOME10 can’t be applied to this order." });
  });
});

/* ── reserveStock ──────────────────────────────────────────────────────── */

const line = (variant = makeVariant(), quantity = 1): OrderLine => ({ variant, quantity, unitPrice: 28_500 });

describe("reserveStock", () => {
  it("decrements with a stock >= quantity guard in the same statement", async () => {
    db.variant.updateMany.mockResolvedValue({ count: 1 });
    await reserveStock(client(), [line(makeVariant(), 3)]);
    expect(db.variant.updateMany).toHaveBeenCalledWith({
      where: { id: "v-bomber-m", stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    });
    expect(db.product.update).toHaveBeenCalledWith({ where: { id: "p-bomber" }, data: { salesCount: { increment: 3 } } });
  });

  it("throws StockError naming the item when it just sold out", async () => {
    db.variant.updateMany.mockResolvedValue({ count: 0 });
    db.variant.findUnique.mockResolvedValue({ stock: 0 });
    await expect(reserveStock(client(), [line()])).rejects.toThrow(new StockError("Field Bomber · Rust · M just sold out. Please update your bag."));
    expect(db.product.update).not.toHaveBeenCalled();
  });

  it("reports how many are left when the guard fails on quantity", async () => {
    db.variant.updateMany.mockResolvedValue({ count: 0 });
    db.variant.findUnique.mockResolvedValue({ stock: 2 });
    await expect(reserveStock(client(), [line(makeVariant(), 3)])).rejects.toThrow("Only 2 left of Field Bomber · Rust · M");
  });

  it("stops at the first failing line, so the transaction can roll back earlier decrements", async () => {
    const second = makeVariant({ id: "v2", productId: "p2" }, { id: "p2", name: "Arc Crossbody" });
    db.variant.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    db.variant.findUnique.mockResolvedValue({ stock: 0 });
    await expect(reserveStock(client(), [line(), line(second)])).rejects.toBeInstanceOf(StockError);
    expect(db.variant.updateMany).toHaveBeenCalledTimes(1);
  });
});

/* ── commitOrder ───────────────────────────────────────────────────────── */

const address = {
  label: "Home",
  fullName: "Alex Morgan",
  line1: "1480 Valencia Street",
  line2: "",
  city: "San Francisco",
  state: "CA",
  postalCode: "94110",
  country: "United States",
  phone: "+1 415 555 0199",
};

function newOrder(overrides: Partial<NewOrder & { saveAddress: boolean }> = {}) {
  const lines = [line(makeVariant(), 2)];
  return {
    number: "HL-123456",
    user: { id: "u1", email: "customer@example.com" },
    address,
    deliveryMethod: "STANDARD" as const,
    lines,
    totals: computeTotals(57_000, "STANDARD", null),
    promo: null,
    paymentProvider: "mock",
    cardLast4: "4242",
    saveAddress: false,
    ...overrides,
  };
}

describe("commitOrder", () => {
  beforeEach(() => {
    db.variant.updateMany.mockResolvedValue({ count: 1 });
    db.order.create.mockImplementation(async ({ data }) => ({ id: "o1", ...data }));
  });

  it("reserves stock, records a PENDING order with line snapshots and clears the cart in one transaction", async () => {
    const order = await commitOrder(db as unknown as TransactionalDb, newOrder());
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(order.status).toBe("PENDING");

    const data = db.order.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ number: "HL-123456", email: "customer@example.com", total: 57_000 + 4703, shipping: 0, paymentProvider: "mock", shipLine2: null });
    expect(data.items.create).toEqual([
      {
        name: "Field Bomber",
        image: "https://images.unsplash.com/bomber",
        variant: "Rust / M",
        unitPrice: 28_500,
        quantity: 2,
        productId: "p-bomber",
        variantId: "v-bomber-m",
      },
    ]);
    expect(db.cartItem.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(db.address.create).not.toHaveBeenCalled();

    // Stock is reserved before the order row exists.
    expect(db.variant.updateMany.mock.invocationCallOrder[0]).toBeLessThan(db.order.create.mock.invocationCallOrder[0]);
  });

  it("records the applied promo code", async () => {
    await commitOrder(db as unknown as TransactionalDb, newOrder({ promo: makePromo() }));
    expect(db.order.create.mock.calls[0][0].data.promoCode).toBe("WELCOME10");
  });

  it("aborts before writing the order or touching the cart when stock runs out", async () => {
    db.variant.updateMany.mockResolvedValue({ count: 0 });
    db.variant.findUnique.mockResolvedValue({ stock: 0 });
    await expect(commitOrder(db as unknown as TransactionalDb, newOrder())).rejects.toBeInstanceOf(StockError);
    expect(db.order.create).not.toHaveBeenCalled();
    expect(db.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it("saves a new address as the default when it is the user's first", async () => {
    db.address.findFirst.mockResolvedValue(null);
    db.address.count.mockResolvedValue(0);
    await commitOrder(db as unknown as TransactionalDb, newOrder({ saveAddress: true }));
    expect(db.address.create).toHaveBeenCalledWith({ data: { ...address, line2: null, isDefault: true, label: "Home", userId: "u1" } });
  });

  it("does not duplicate an address already in the book", async () => {
    db.address.findFirst.mockResolvedValue({ id: "a1" });
    await commitOrder(db as unknown as TransactionalDb, newOrder({ saveAddress: true }));
    expect(db.address.create).not.toHaveBeenCalled();
  });
});

/* ── payment providers ─────────────────────────────────────────────────── */

describe("MockProvider", () => {
  const provider = new MockProvider();
  it("requires card details", () => {
    expect(provider.validate({})).toMatchObject({ ok: false, error: "Enter your card details." });
  });

  it("declines Stripe's generic-decline test card before any stock is touched", () => {
    expect(provider.validate({ mockPayment: toMockPayment({ cardNumber: MOCK_DECLINE_CARD }) })).toEqual({ ok: false, error: "Your card was declined. Try another card." });
  });

  it("settles immediately with a mock payment reference", async () => {
    expect(provider.validate({ mockPayment: { last4: "4242", outcome: "success" } })).toEqual({ ok: true });
    expect(await provider.initiate()).toMatchObject({ status: "paid", paymentRef: expect.stringMatching(/^mock_/) });
  });
});

describe("isMockAllowed", () => {
  it("allows the mock processor outside production", () => {
    expect(isMockAllowed({ NODE_ENV: "development" })).toBe(true);
  });

  it("disables it in production unless explicitly opted in", () => {
    expect(isMockAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isMockAllowed({ NODE_ENV: "production", ALLOW_MOCK_PAYMENTS: "1" })).toBe(false);
    expect(isMockAllowed({ NODE_ENV: "production", ALLOW_MOCK_PAYMENTS: "true" })).toBe(true);
  });
});
