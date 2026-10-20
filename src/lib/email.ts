/**
 * Transactional email via Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Without RESEND_API_KEY + EMAIL_FROM:
 * - development: the message (including links) is printed to the server console
 * - production: nothing is sent and only a short warning is logged (never the body, which may
 *   contain a reset link). Callers must not claim an email was sent; see isEmailConfigured().
 */
export type EmailMessage = { to: string; subject: string; text: string; html: string };
export type SendResult = { sent: boolean };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured(env: Record<string, string | undefined> = process.env) {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage, env: Record<string, string | undefined> = process.env): Promise<SendResult> {
  if (!isEmailConfigured(env)) {
    if (env.NODE_ENV !== "production") {
      console.info(`\n📧 [email not configured — dev preview]\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
    } else {
      console.warn(`[email] RESEND_API_KEY/EMAIL_FROM not set; "${message.subject}" was not sent.`);
    }
    return { sent: false };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
    });
    if (!res.ok) {
      console.error(`[email] Resend rejected "${message.subject}": ${res.status} ${await res.text().catch(() => "")}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error(`[email] Failed to send "${message.subject}"`, error);
    return { sent: false };
  }
}
