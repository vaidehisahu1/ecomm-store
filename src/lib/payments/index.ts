import "server-only";
import { MockProvider } from "@/lib/payments/mock-provider";
import { StripeProvider } from "@/lib/payments/stripe-provider";
import type { PaymentProvider } from "@/lib/payments/types";
import { stripe } from "@/lib/stripe";

export type { PaymentProvider } from "@/lib/payments/types";

export type PaymentMode = PaymentProvider["name"] | "disabled";

/**
 * The mock processor would "sell" goods without taking money, so in production it is
 * only allowed when explicitly opted into (e.g. a public demo deployment).
 */
export function isMockAllowed(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV !== "production" || env.ALLOW_MOCK_PAYMENTS === "true";
}

/** Stripe when STRIPE_SECRET_KEY is set; otherwise the mock provider where permitted; otherwise null. */
export function getPaymentProvider(): PaymentProvider | null {
  if (stripe) return new StripeProvider(stripe);
  return isMockAllowed() ? new MockProvider() : null;
}

export function getPaymentMode(): PaymentMode {
  return getPaymentProvider()?.name ?? "disabled";
}
