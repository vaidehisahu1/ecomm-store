"use server";

import { db } from "@/lib/db";
import { contactSchema, fieldErrors } from "@/lib/validators";

export type ContactState =
  | { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> }
  | undefined;

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(["name", "email", "topic", "message"].map((k) => [k, String(formData.get(k) ?? "")]));
  // Honeypot: real people never fill the hidden "company" field.
  if (formData.get("company")) return { ok: true };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };
  await db.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
