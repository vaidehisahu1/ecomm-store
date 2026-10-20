import { afterEach, describe, expect, it, vi } from "vitest";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { escapeHtml, orderConfirmationEmail, passwordResetEmail } from "@/lib/email-templates";

const msg = { to: "a@example.com", subject: "Reset your password", text: "secret link https://x/reset-password/TOKEN", html: "<p>hi</p>" };
const configured = { RESEND_API_KEY: "re_test", EMAIL_FROM: "Halden <hello@example.com>", NODE_ENV: "production" };

afterEach(() => vi.restoreAllMocks());

describe("sendEmail", () => {
  it("requires both RESEND_API_KEY and EMAIL_FROM", () => {
    expect(isEmailConfigured({ RESEND_API_KEY: "re_x" })).toBe(false);
    expect(isEmailConfigured(configured)).toBe(true);
  });

  it("prints the full message in development when not configured", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await sendEmail(msg, { NODE_ENV: "development" })).toEqual({ sent: false });
    expect(info.mock.calls[0][0]).toContain("TOKEN");
  });

  it("never logs the body in production when not configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await sendEmail(msg, { NODE_ENV: "production" })).toEqual({ sent: false });
    expect(warn.mock.calls.flat().join(" ")).not.toContain("TOKEN");
    expect(info).not.toHaveBeenCalled();
  });

  it("posts to Resend with the API key and reports success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await sendEmail(msg, configured)).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(init?.body))).toMatchObject({ from: configured.EMAIL_FROM, to: ["a@example.com"], subject: msg.subject });
  });

  it("reports failure instead of throwing when Resend rejects or the network fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("bad", { status: 422 })).mockRejectedValueOnce(new Error("offline"));
    expect(await sendEmail(msg, configured)).toEqual({ sent: false });
    expect(await sendEmail(msg, configured)).toEqual({ sent: false });
  });
});

describe("email templates", () => {
  it("escapes HTML in user-supplied values", () => {
    expect(escapeHtml(`<img src=x onerror="a">&'`)).toBe("&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
    const email = passwordResetEmail({ to: "a@b.co", name: "<script>x</script> Doe", url: "https://s/r/t", minutes: 30 });
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("expires in 30 minutes");
  });

  it("renders an order confirmation with lines and totals", () => {
    const email = orderConfirmationEmail(
      { number: "HL-1", email: "a@b.co", shipName: "Alex M", total: 10_825, subtotal: 10_000, discount: 0, shipping: 0, tax: 825, deliveryMethod: "STANDARD", items: [{ name: "Tee", variant: "Ink / M", quantity: 2, unitPrice: 5_000 }] },
      "https://s/account/orders/HL-1",
    );
    expect(email.subject).toBe("Order HL-1 confirmed");
    expect(email.text).toContain("2 × Tee (Ink / M) — $100");
    expect(email.text).toContain("Total: $108.25");
  });
});
