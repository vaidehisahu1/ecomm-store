import type { PaymentProvider } from "@/lib/payments/types";

export { MOCK_DECLINE_CARD } from "@/lib/payments/mock-card";

/** Demo processor: accepts any valid test card instantly. Never use for real money. */
export class MockProvider implements PaymentProvider {
  readonly name = "mock" as const;

  validate({ mockPayment }: Parameters<PaymentProvider["validate"]>[0]) {
    if (!mockPayment) return { ok: false as const, error: "Enter your card details.", fieldErrors: { cardNumber: "Card details are required" } };
    if (mockPayment.outcome === "decline") return { ok: false as const, error: "Your card was declined. Try another card." };
    return { ok: true as const };
  }

  async initiate() {
    return { status: "paid" as const, paymentRef: `mock_${crypto.randomUUID().slice(0, 18)}` };
  }
}
