"use server";

import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validators";

export type NewsletterState = { ok?: boolean; error?: string } | undefined;

export async function subscribe(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email },
  });
  return { ok: true };
}
