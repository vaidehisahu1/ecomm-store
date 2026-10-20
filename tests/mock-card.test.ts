import { describe, expect, it } from "vitest";
import { MOCK_DECLINE_CARD, toMockPayment } from "@/lib/payments/mock-card";

describe("toMockPayment", () => {
  it("keeps only the last four digits; the full number, expiry and CVC are never included", () => {
    const card = { cardName: "Alex", cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };
    const payload = toMockPayment(card);
    expect(payload).toEqual({ last4: "4242", outcome: "success" });
    const wire = JSON.stringify(payload);
    expect(wire).not.toContain("424242424242");
    expect(wire).not.toContain("12/30");
    expect(wire).not.toContain("123");
  });

  it("maps the decline test card to a decline outcome", () => {
    expect(toMockPayment({ cardNumber: "4000 0000 0000 0002" })).toEqual({ last4: "0002", outcome: "decline" });
    expect(toMockPayment({ cardNumber: MOCK_DECLINE_CARD }).outcome).toBe("decline");
  });
});
