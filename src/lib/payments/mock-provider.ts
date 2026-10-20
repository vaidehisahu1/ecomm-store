import type { PaymentProvider } from "@/lib/payments/types";

/** Stripe's "generic decline" test card, mirrored so the demo can show a failed payment. */
export const MOCK_DECLINE_CARD = "4000000000000002";

/** Demo processor: accepts any valid test card instantly. Never use for real money. */
export class MockProvider implements PaymentProvider {
  readonly name = "mock" as const;

  validate({ card }: Parameters<PaymentProvider["validate"]>[0]) {
    if (!card) return { ok: false as const, error: "Enter your card details.", fieldErrors: { "card.cardNumber": "Card details are required" } };
    if (card.cardNumber === MOCK_DECLINE_CARD) return { ok: false as const, error: "Your card was declined. Try another card." };
    return { ok: true as const };
  }

  async initiate() {
    return { status: "paid" as const, paymentRef: `mock_${crypto.randomUUID().slice(0, 18)}` };
  }
}
