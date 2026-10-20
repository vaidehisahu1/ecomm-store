import { describe, expect, it } from "vitest";
import { computeTotals, discountFor, FREE_SHIPPING_THRESHOLD, shippingFor, TAX_RATE, type PromoInput } from "@/lib/pricing";

const percent = (value: number, minSubtotal = 0): PromoInput => ({ code: "P", type: "PERCENT", value, minSubtotal });
const fixed = (value: number, minSubtotal = 0): PromoInput => ({ code: "F", type: "FIXED", value, minSubtotal });
const freeShip = (minSubtotal = 0): PromoInput => ({ code: "S", type: "FREE_SHIPPING", value: 0, minSubtotal });

describe("shippingFor", () => {
  it("charges each method's flat rate below the threshold", () => {
    expect(shippingFor("STANDARD", 5000)).toBe(800);
    expect(shippingFor("EXPRESS", 5000)).toBe(1800);
    expect(shippingFor("NEXT_DAY", 5000)).toBe(3200);
  });

  it("makes only STANDARD free at or above the threshold", () => {
    expect(shippingFor("STANDARD", FREE_SHIPPING_THRESHOLD - 1)).toBe(800);
    expect(shippingFor("STANDARD", FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFor("EXPRESS", FREE_SHIPPING_THRESHOLD * 3)).toBe(1800);
  });

  it("is free for any method when a free-shipping promo applies", () => {
    expect(shippingFor("NEXT_DAY", 100, true)).toBe(0);
  });
});

describe("discountFor", () => {
  it("returns 0 without a promo", () => {
    expect(discountFor(null, 10_000)).toBe(0);
  });

  it("applies a percentage, rounded to the nearest cent", () => {
    expect(discountFor(percent(10), 10_000)).toBe(1000);
    expect(discountFor(percent(10), 4855)).toBe(486); // 485.5 rounds up
  });

  it("caps a fixed discount at the subtotal so totals never go negative", () => {
    expect(discountFor(fixed(2500), 10_000)).toBe(2500);
    expect(discountFor(fixed(2500), 1800)).toBe(1800);
  });

  it("gives no discount below the promo's minimum subtotal", () => {
    expect(discountFor(percent(20, 25_000), 24_999)).toBe(0);
    expect(discountFor(percent(20, 25_000), 25_000)).toBe(5000);
  });

  it("treats free-shipping promos as a shipping benefit, not a discount", () => {
    expect(discountFor(freeShip(), 10_000)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("adds shipping and tax with no promo", () => {
    expect(computeTotals(4800, "STANDARD", null)).toEqual({ subtotal: 4800, discount: 0, shipping: 800, tax: 396, total: 5996 });
  });

  it("taxes the discounted subtotal, not the gross", () => {
    const t = computeTotals(20_000, "EXPRESS", percent(10));
    expect(t.discount).toBe(2000);
    expect(t.tax).toBe(Math.round(18_000 * TAX_RATE));
    expect(t.total).toBe(20_000 - 2000 + 1800 + t.tax);
  });

  it("rounds tax to whole cents", () => {
    expect(computeTotals(4850, "STANDARD", null).tax).toBe(400); // 400.125
    expect(computeTotals(4870, "STANDARD", null).tax).toBe(402); // 401.775
  });

  it("free-shipping promo zeroes shipping only once its minimum is met", () => {
    expect(computeTotals(9000, "NEXT_DAY", freeShip(10_000)).shipping).toBe(3200);
    expect(computeTotals(10_000, "NEXT_DAY", freeShip(10_000)).shipping).toBe(0);
  });

  it("keeps the free-shipping threshold based on the pre-discount subtotal", () => {
    // $160 of goods with $25 off still ships free on standard.
    const t = computeTotals(16_000, "STANDARD", fixed(2500));
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(13_500 + Math.round(13_500 * TAX_RATE));
  });
});
