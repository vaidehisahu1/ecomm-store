import { z } from "zod";
import type { CardInput } from "@/lib/validators";

/** Stripe's "generic decline" test card, mirrored so the demo can show a failed payment. */
export const MOCK_DECLINE_CARD = "4000000000000002";

/**
 * What the mock checkout sends to the server instead of card details. The full number, expiry and
 * CVC are validated in the browser and never leave it.
 */
export const mockPaymentSchema = z.object({
  last4: z.string().regex(/^\d{4}$/),
  outcome: z.enum(["success", "decline"]),
});
export type MockPayment = z.infer<typeof mockPaymentSchema>;

/** Runs in the browser on an already-validated card. */
export function toMockPayment(card: Pick<CardInput, "cardNumber">): MockPayment {
  const digits = card.cardNumber.replace(/\D/g, "");
  return { last4: digits.slice(-4), outcome: digits === MOCK_DECLINE_CARD ? "decline" : "success" };
}
