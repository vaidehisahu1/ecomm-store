"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/safe-redirect";
import { fieldErrors, forgotPasswordSchema, loginSchema, registerSchema } from "@/lib/validators";

export type AuthFormState =
  | { error?: string; fieldErrors?: Record<string, string>; success?: string; values?: Record<string, string> }
  | undefined;

/** Echo back non-secret fields so the form keeps them after React resets it. */
function keep(formData: FormData, ...keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const values = keep(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const limited = await rateLimit("login", await headers());
  if (!limited.success) return { error: rateLimitMessage(limited.resetAt), values };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  } catch (error) {
    if (error instanceof AuthError) return { error: "That email and password combination didn't work.", values };
    throw error;
  }
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  const values = keep(formData, "name", "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const limited = await rateLimit("register", await headers());
  if (!limited.success) return { error: rateLimitMessage(limited.resetAt), values };
  const { name, email, password } = parsed.data;
  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { fieldErrors: { email: "An account with this email already exists." }, values };
  await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  try {
    await signIn("credentials", { email, password, redirectTo: safeRedirect(formData.get("callbackUrl")) });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Your account was created, but we couldn't sign you in." };
    throw error;
  }
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: keep(formData, "email") };
  // Email delivery is out of scope for the demo. The response is identical whether or not
  // the account exists, so the form can't be used to discover registered emails.
  return { success: parsed.data.email };
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
