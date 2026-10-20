import { beforeEach, describe, expect, it, vi } from "vitest";

const processed = new Set<string>();
const recorded: { id: string; outcome: string }[] = [];
const applyCompletedCheckout = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (body: string, signature: string) => {
        if (signature !== "valid") throw new Error("bad signature");
        return JSON.parse(body);
      },
    },
  },
}));
vi.mock("@/lib/payments/stripe-checkout", () => ({ applyCompletedCheckout: (...args: unknown[]) => applyCompletedCheckout(...args) }));
vi.mock("@/lib/payments/stripe-live", () => ({
  liveCheckoutDeps: () => ({}),
  isEventProcessed: async (id: string) => processed.has(id),
  recordStripeEvent: async (id: string, _type: string, result: { outcome: string }) => {
    processed.add(id);
    recorded.push({ id, outcome: result.outcome });
  },
}));

const { POST } = await import("@/app/api/stripe/webhook/route");

function deliver(event: object, signature = "valid") {
  return POST(new Request("http://x/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body: JSON.stringify(event) }));
}
const completed = { id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_1", payment_status: "paid", metadata: { orderId: "o1" } } } };

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  processed.clear();
  recorded.length = 0;
  applyCompletedCheckout.mockReset().mockResolvedValue({ outcome: "refunded", orderId: "o1", detail: "re_1" });
});

describe("Stripe webhook route", () => {
  it("rejects bad signatures", async () => {
    expect((await deliver(completed, "forged")).status).toBe(400);
    expect(applyCompletedCheckout).not.toHaveBeenCalled();
  });

  it("applies a completed session once and records the outcome", async () => {
    const res = await deliver(completed);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, outcome: "refunded" });
    expect(recorded).toEqual([{ id: "evt_1", outcome: "refunded" }]);
  });

  it("is idempotent: a redelivered event is acknowledged but not re-applied", async () => {
    await deliver(completed);
    const again = await deliver(completed);
    expect(await again.json()).toEqual({ received: true, duplicate: true });
    expect(applyCompletedCheckout).toHaveBeenCalledTimes(1);
  });

  it("acknowledges other event types without processing them", async () => {
    expect(await (await deliver({ ...completed, id: "evt_2", type: "payment_intent.created" })).json()).toEqual({ received: true });
    expect(applyCompletedCheckout).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors so Stripe retries, without marking the event processed", async () => {
    applyCompletedCheckout.mockRejectedValueOnce(new Error("db down"));
    await expect(deliver(completed)).rejects.toThrow("db down");
    expect(processed.has("evt_1")).toBe(false);
  });
});
