/**
 * Integration test: the atomic stock guard against a real Postgres.
 *
 *   DATABASE_URL_TEST="postgresql://user:pass@localhost:5432/halden_test" npm run test:integration
 *
 * The database must already have the schema (`DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy`).
 * The test creates its own uniquely named rows and deletes them afterwards. It refuses non-local
 * hosts unless ALLOW_REMOTE_TEST_DB=true, so it can't touch a production database by accident.
 * Skipped entirely when DATABASE_URL_TEST is unset.
 */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildOrderLines } from "@/lib/checkout/lines";
import { commitOrder } from "@/lib/checkout/order";
import { StockError } from "@/lib/checkout/stock";
import { computeTotals } from "@/lib/pricing";

const url = process.env.DATABASE_URL_TEST;
const host = url ? new URL(url).hostname : "";
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
if (url && !isLocal && process.env.ALLOW_REMOTE_TEST_DB !== "true") {
  throw new Error(`DATABASE_URL_TEST points at "${host}". Use a local test database, or set ALLOW_REMOTE_TEST_DB=true if that host is a disposable test database.`);
}

const run = `it${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const address = { label: "Home", fullName: "Test Buyer", line1: "1 Test Street", line2: "", city: "Testville", state: "CA", postalCode: "94110", country: "United States", phone: "+1 415 555 0100" };

describe.skipIf(!url)("stock guard on real Postgres", () => {
  const db = new PrismaClient({ datasourceUrl: url });
  let variantId = "";
  let productId = "";
  const users: { id: string; email: string }[] = [];

  beforeAll(async () => {
    const category = await db.category.create({ data: { name: `Cat ${run}`, slug: `cat-${run}`, description: "test", image: "x" } });
    const product = await db.product.create({
      data: { name: `Last One ${run}`, slug: `last-one-${run}`, tagline: "t", description: "integration test product", price: 5000, categoryId: category.id, variants: { create: { sku: `SKU-${run}`, stock: 1 } } },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0].id;
    for (let i = 0; i < 8; i++) users.push(await db.user.create({ data: { name: `Buyer ${i}`, email: `buyer${i}-${run}@example.com`, passwordHash: "x" } }));
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { number: { startsWith: `T-${run}` } } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.category.deleteMany({ where: { slug: `cat-${run}` } });
    await db.user.deleteMany({ where: { email: { endsWith: `-${run}@example.com` } } });
    await db.$disconnect();
  });

  async function buy(buyer: { id: string; email: string }, n: number, quantity = 1) {
    const priced = await buildOrderLines(db, [{ variantId, quantity }]);
    if (!priced.ok) throw new Error(priced.error);
    return commitOrder(db, {
      number: `T-${run}-${n}`,
      user: buyer,
      address,
      deliveryMethod: "STANDARD",
      lines: priced.value.lines,
      totals: computeTotals(priced.value.subtotal, "STANDARD", null),
      promo: null,
      paymentProvider: "mock",
      cardLast4: null,
      saveAddress: false,
    });
  }

  it("lets exactly one of two concurrent buyers take the last item", async () => {
    const results = await Promise.allSettled([buy(users[0], 1), buy(users[1], 2)]);
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    expect(lost[0].reason).toBeInstanceOf(StockError);
    expect((lost[0].reason as Error).message).toMatch(/just sold out/);

    expect((await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock).toBe(0);
    expect(await db.order.count({ where: { number: { startsWith: `T-${run}-` } } })).toBe(1);
    // The losing transaction rolled back completely: no stray order, and salesCount moved once.
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).salesCount).toBe(1);
  });

  it("never oversells under heavier contention (8 buyers, 3 units)", async () => {
    await db.variant.update({ where: { id: variantId }, data: { stock: 3 } });
    await db.order.deleteMany({ where: { number: { startsWith: `T-${run}-` } } });
    const results = await Promise.allSettled(users.map((u, i) => buy(u, 100 + i)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((r) => r.status === "rejected").every((r) => (r as PromiseRejectedResult).reason instanceof StockError)).toBe(true);
    expect((await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock).toBe(0);
  });
});
