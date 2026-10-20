import { deliveryOptions } from "@/lib/pricing";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import type { EmailMessage } from "@/lib/email";

/** User-supplied values (names, addresses) must never be interpreted as HTML. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#161513">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 32px">${escapeHtml(site.name)}</p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 16px">${escapeHtml(title)}</h1>
${body}
<p style="font-size:12px;color:#6b665d;margin-top:40px">${escapeHtml(site.name)} · ${escapeHtml(site.address)}</p>
</div></body></html>`;
}

export function passwordResetEmail({ to, name, url, minutes }: { to: string; name: string; url: string; minutes: number }): EmailMessage {
  const first = name.split(" ")[0] || "there";
  return {
    to,
    subject: `Reset your ${site.name} password`,
    text: `Hi ${first},\n\nUse this link to choose a new password. It works once and expires in ${minutes} minutes:\n\n${url}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
    html: layout(
      "Reset your password",
      `<p style="line-height:1.6">Hi ${escapeHtml(first)}, use the button below to choose a new password. The link works once and expires in ${minutes} minutes.</p>
<p style="margin:28px 0"><a href="${escapeHtml(url)}" style="background:#161513;color:#f6f4ef;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block">Choose a new password</a></p>
<p style="font-size:13px;color:#6b665d;line-height:1.6">If you didn't ask for this, ignore this email and your password won't change.</p>`,
    ),
  };
}

export type ConfirmationOrder = {
  number: string;
  email: string;
  shipName: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  deliveryMethod: keyof typeof deliveryOptions;
  items: { name: string; variant: string; quantity: number; unitPrice: number }[];
};

export function orderConfirmationEmail(order: ConfirmationOrder, orderUrl: string): EmailMessage {
  const first = order.shipName.split(" ")[0] || "there";
  const delivery = deliveryOptions[order.deliveryMethod];
  const lines = order.items.map((i) => `${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ""} — ${formatPrice(i.unitPrice * i.quantity)}`);
  const totals: [string, string][] = [
    ["Subtotal", formatPrice(order.subtotal)],
    ...(order.discount > 0 ? ([["Discount", `−${formatPrice(order.discount)}`]] as [string, string][]) : []),
    ["Shipping", order.shipping === 0 ? "Free" : formatPrice(order.shipping)],
    ["Tax", formatPrice(order.tax)],
    ["Total", formatPrice(order.total)],
  ];
  return {
    to: order.email,
    subject: `Order ${order.number} confirmed`,
    text: [
      `Hi ${first},`,
      "",
      `Thanks for your order. Payment is confirmed and we're preparing it now. Expected delivery: ${delivery.eta.toLowerCase()} (${delivery.label}).`,
      "",
      ...lines,
      "",
      ...totals.map(([k, v]) => `${k}: ${v}`),
      "",
      `Track your order: ${orderUrl}`,
    ].join("\n"),
    html: layout(
      `Order ${order.number} confirmed`,
      `<p style="line-height:1.6">Hi ${escapeHtml(first)}, thanks for your order. Payment is confirmed and we're preparing it now. Expected delivery: ${escapeHtml(delivery.eta.toLowerCase())}.</p>
<table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px">${order.items
        .map(
          (i) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e2ddd3">${i.quantity} × ${escapeHtml(i.name)}${i.variant ? ` <span style="color:#6b665d">${escapeHtml(i.variant)}</span>` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #e2ddd3;text-align:right">${formatPrice(i.unitPrice * i.quantity)}</td></tr>`,
        )
        .join("")}${totals
        .map(([k, v]) => `<tr><td style="padding:4px 0;color:#6b665d">${k}</td><td style="padding:4px 0;text-align:right">${v}</td></tr>`)
        .join("")}</table>
<p><a href="${escapeHtml(orderUrl)}" style="color:#a84a24">Track your order</a></p>`,
    ),
  };
}
