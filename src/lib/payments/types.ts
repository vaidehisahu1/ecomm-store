import type { CardInput } from "@/lib/validators";

/** A purchased line as the payment provider needs to describe it. Amounts are integer cents. */
export type PaymentLine = { name: string; description?: string; image?: string; unitPrice: number; quantity: number };

export type PaymentOrder = { id: string; number: string; email: string };

export type PaymentTotals = { discount: number; shipping: number; tax: number; total: number };

export type PaymentContext = {
  order: PaymentOrder;
  lines: PaymentLine[];
  totals: PaymentTotals;
  /** Human-readable delivery method, e.g. "Express — 2–3 business days" */
  deliveryLabel: string;
  promoCode?: string | null;
};

export type PaymentValidation = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Either the payment settled immediately, or the customer must finish on a hosted page. */
export type PaymentInitiation = { status: "paid"; paymentRef: string } | { status: "redirect"; url: string };

export interface PaymentProvider {
  /** Stored on the order as `paymentProvider`. */
  readonly name: "mock" | "stripe";
  /** Called before any stock is reserved, so declines never touch inventory. */
  validate(input: { card?: CardInput }): PaymentValidation;
  /** Called after the order is created (status PENDING). Throwing triggers a cancel + restock. */
  initiate(ctx: PaymentContext): Promise<PaymentInitiation>;
}
