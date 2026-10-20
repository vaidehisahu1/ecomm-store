"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validators";

export type NewsletterState = { ok?: boolean; error?: string } | undefined;

export async function subscribe(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  const limited = await rateLimit("newsletter", await headers());
  if (!limited.success) return { error: rateLimitMessage(limited.resetAt) };
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email },
  });
  return { ok: true };
}
