import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addressSchema, cardSchema, checkoutSchema, isAllowedImageUrl, passwordSchema, registerSchema } from "@/lib/validators";

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues.map((i) => i.message) ?? [];

describe("passwordSchema", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordSchema.safeParse("Halden2026").success).toBe(true);
  });

  it.each([
    ["Ab1", "Use at least 8 characters"],
    ["alllower123", "Include an uppercase letter"],
    ["ALLUPPER123", "Include a lowercase letter"],
    ["NoDigitsHere", "Include a number"],
  ])("rejects %s", (pw, message) => {
    expect(messages(passwordSchema.safeParse(pw))).toContain(message);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    expect(passwordSchema.safeParse(`Aa1${"x".repeat(70)}`).success).toBe(false);
  });

  it("registerSchema reports mismatched confirmation on the confirm field", () => {
    const r = registerSchema.safeParse({ name: "Alex", email: "a@b.co", password: "Halden2026", confirmPassword: "Halden2027" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});

describe("cardSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  const card = { cardName: "Alex Morgan", cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

  it("accepts a Luhn-valid card and strips spaces", () => {
    const r = cardSchema.safeParse(card);
    expect(r.success).toBe(true);
    expect(r.data?.cardNumber).toBe("4242424242424242");
  });

  it("accepts a 15-digit Amex number", () => {
    expect(cardSchema.safeParse({ ...card, cardNumber: "378282246310005" }).success).toBe(true);
  });

  it("rejects a number that fails the Luhn check", () => {
    expect(messages(cardSchema.safeParse({ ...card, cardNumber: "4242424242424241" }))).toContain("This card number looks incorrect");
  });

  it("rejects non-numeric or wrong-length numbers", () => {
    expect(cardSchema.safeParse({ ...card, cardNumber: "4242-4242" }).success).toBe(false);
  });

  it("treats a card as valid through the end of its expiry month", () => {
    expect(cardSchema.safeParse({ ...card, expiry: "10/26" }).success).toBe(true);
    expect(messages(cardSchema.safeParse({ ...card, expiry: "09/26" }))).toContain("This card has expired");
  });

  it("requires MM/YY with a real month", () => {
    expect(messages(cardSchema.safeParse({ ...card, expiry: "13/30" }))).toContain("Use MM/YY");
    expect(messages(cardSchema.safeParse({ ...card, expiry: "1230" }))).toContain("Use MM/YY");
  });

  it("requires a 3–4 digit CVC", () => {
    expect(cardSchema.safeParse({ ...card, cvc: "12" }).success).toBe(false);
    expect(cardSchema.safeParse({ ...card, cvc: "1234" }).success).toBe(true);
  });
});

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

describe("addressSchema", () => {
  it("accepts a complete address with an empty optional line", () => {
    expect(addressSchema.safeParse(address).success).toBe(true);
  });

  it("accepts international postal codes", () => {
    expect(addressSchema.safeParse({ ...address, postalCode: "SW1A 1AA" }).success).toBe(true);
  });

  it.each([
    ["postalCode", "!!", "Enter a valid postal code"],
    ["phone", "call me", "Enter a valid phone number"],
    ["fullName", "A", "Enter the recipient's name"],
    ["line1", "", "Enter a street address"],
  ])("rejects an invalid %s", (field, value, message) => {
    expect(messages(addressSchema.safeParse({ ...address, [field]: value }))).toContain(message);
  });
});

describe("checkoutSchema", () => {
  const base = { items: [{ variantId: "v1", quantity: 1 }], address, deliveryMethod: "STANDARD" };

  it("defaults saveAddress to false and normalises the promo code", () => {
    const r = checkoutSchema.safeParse({ ...base, promoCode: "  welcome10 " });
    expect(r.success).toBe(true);
    expect(r.data?.saveAddress).toBe(false);
    expect(r.data?.promoCode).toBe("WELCOME10");
  });

  it("rejects an empty bag", () => {
    expect(messages(checkoutSchema.safeParse({ ...base, items: [] }))).toContain("Your bag is empty");
  });

  it("rejects non-integer or out-of-range quantities", () => {
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: "v1", quantity: 0 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: "v1", quantity: 21 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: "v1", quantity: 1.5 }] }).success).toBe(false);
  });

  it("rejects an unknown delivery method", () => {
    expect(checkoutSchema.safeParse({ ...base, deliveryMethod: "TELEPORT" }).success).toBe(false);
  });

  it("validates a nested card when one is supplied", () => {
    const bad = { ...base, card: { cardName: "A B", cardNumber: "1234", expiry: "12/30", cvc: "123" } };
    expect(checkoutSchema.safeParse(bad).success).toBe(false);
  });
});

describe("isAllowedImageUrl", () => {
  it("allows Unsplash and our own uploads only", () => {
    expect(isAllowedImageUrl("https://images.unsplash.com/photo-1?w=10")).toBe(true);
    expect(isAllowedImageUrl("/api/uploads/cmabc123.jpg")).toBe(true);
    expect(isAllowedImageUrl("https://evil.example/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("/api/uploads/../../etc/passwd")).toBe(false);
  });
});
