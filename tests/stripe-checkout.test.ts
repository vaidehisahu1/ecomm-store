import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyCompletedCheckout, closeCheckoutSession, type CheckoutDeps, type CompletedSession, type StripeCheckoutApi } from "@/lib/payments/stripe-checkout";

function fakeStripe(...statuses: string[]) {
  const retrieve = vi.fn();
  for (const status of statuses) retrieve.mockResolvedValueOnce({ status });
  const expire = vi.fn().mockResolvedValue({});
  return { api: { checkout: { sessions: { retrieve, expire } } } as unknown as StripeCheckoutApi, retrieve, expire };
}

describe("closeCheckoutSession", () => {
  it("does nothing without a Checkout Session id", async () => {
    const s = fakeStripe();
    expect(await closeCheckoutSession(s.api, null)).toBe("no_session");
    expect(await closeCheckoutSession(s.api, "mock_123")).toBe("no_session");
    expect(s.retrieve).not.toHaveBeenCalled();
  });

  it("expires an open session", async () => {
    const s = fakeStripe("open");
    expect(await closeCheckoutSession(s.api, "cs_test_1")).toBe("expired");
    expect(s.expire).toHaveBeenCalledWith("cs_test_1");
  });

  it("reports an already-paid session and leaves it alone, so the order is not cancelled", async () => {
    const s = fakeStripe("complete");
    expect(await closeCheckoutSession(s.api, "cs_test_1")).toBe("completed");
    expect(s.expire).not.toHaveBeenCalled();
  });

  it("treats an expired session as closed", async () => {
    expect(await closeCheckoutSession(fakeStripe("expired").api, "cs_test_1")).toBe("already_closed");
  });

  it("detects a payment that completes while we try to expire", async () => {
    const s = fakeStripe("open", "complete");
    s.expire.mockRejectedValueOnce(new Error("session is complete"));
    expect(await closeCheckoutSession(s.api, "cs_test_1")).toBe("completed");
  });

  it("rethrows unexpected Stripe errors", async () => {
    const s = fakeStripe("open", "open");
    s.expire.mockRejectedValueOnce(new Error("network down"));
    await expect(closeCheckoutSession(s.api, "cs_test_1")).rejects.toThrow("network down");
  });
});

describe("applyCompletedCheckout", () => {
  const paid: CompletedSession = { id: "cs_1", payment_status: "paid", metadata: { orderId: "o1" }, payment_intent: "pi_1" };
  let deps: { [K in keyof CheckoutDeps]: ReturnType<typeof vi.fn> };
  const run = (session: CompletedSession = paid) => applyCompletedCheckout(session, deps as unknown as CheckoutDeps);

  beforeEach(() => {
    deps = { findOrder: vi.fn(), markPaid: vi.fn().mockResolvedValue({ count: 1 }), refund: vi.fn().mockResolvedValue({ id: "re_1" }) };
  });

  it("marks a pending order paid with the payment intent", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "PENDING" });
    expect(await run()).toEqual({ outcome: "paid", orderId: "o1" });
    expect(deps.markPaid).toHaveBeenCalledWith("o1", "pi_1");
    expect(deps.refund).not.toHaveBeenCalled();
  });

  it("is a no-op for an order that is already paid (duplicate delivery)", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "PAID" });
    expect(await run()).toEqual({ outcome: "already_paid", orderId: "o1" });
    expect(deps.markPaid).not.toHaveBeenCalled();
    expect(deps.refund).not.toHaveBeenCalled();
  });

  it("keeps a cancelled order cancelled and refunds the late payment", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "CANCELLED" });
    expect(await run()).toEqual({ outcome: "refunded", orderId: "o1", detail: "re_1" });
    expect(deps.markPaid).not.toHaveBeenCalled();
    expect(deps.refund).toHaveBeenCalledWith("pi_1", "refund-cancelled-order-o1");
  });

  it("uses the same idempotency key on retries so Stripe never refunds twice", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "CANCELLED" });
    await run();
    await run();
    expect(deps.refund.mock.calls[0][1]).toBe(deps.refund.mock.calls[1][1]);
  });

  it("handles the order being cancelled between our read and the paid update", async () => {
    deps.findOrder.mockResolvedValueOnce({ id: "o1", status: "PENDING" }).mockResolvedValueOnce({ id: "o1", status: "CANCELLED" });
    deps.markPaid.mockResolvedValue({ count: 0 });
    expect(await run()).toMatchObject({ outcome: "refunded" });
  });

  it("records needs_manual_refund instead of failing when the refund call errors", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "CANCELLED" });
    deps.refund.mockRejectedValue(new Error("charge already refunded"));
    const r = await run();
    expect(r.outcome).toBe("needs_manual_refund");
    expect(r).toMatchObject({ orderId: "o1", detail: expect.stringContaining("pi_1") });
  });

  it("flags manual refund when there is no payment intent to refund", async () => {
    deps.findOrder.mockResolvedValue({ id: "o1", status: "CANCELLED" });
    expect((await run({ ...paid, payment_intent: null })).outcome).toBe("needs_manual_refund");
  });

  it.each([
    ["unpaid sessions", { ...paid, payment_status: "unpaid" }, "ignored"],
    ["sessions without an order id", { ...paid, metadata: {} }, "ignored"],
  ])("ignores %s", async (_c, session, outcome) => {
    expect((await run(session)).outcome).toBe(outcome);
    expect(deps.findOrder).not.toHaveBeenCalled();
  });

  it("reports unknown orders without throwing", async () => {
    deps.findOrder.mockResolvedValue(null);
    expect(await run()).toEqual({ outcome: "order_not_found", orderId: "o1" });
  });
});
