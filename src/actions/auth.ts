"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { consumeResetToken, issueResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/safe-redirect";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";
import { fieldErrors, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validators";

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

/**
 * Starts a password reset. The response depends only on input validity, rate limits and whether
 * email is configured, never on whether the account exists, so it can't be used to probe emails.
 * The email is sent after the response (next/server `after`) so timing doesn't leak existence either.
 */
export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  const values = keep(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const limited = await rateLimit("passwordReset", await headers());
  if (!limited.success) return { error: rateLimitMessage(limited.resetAt), values };
  if (process.env.NODE_ENV === "production" && !isEmailConfigured()) {
    return { error: `Password reset by email isn’t available right now. Please contact us at ${site.email}.`, values };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true } });
  if (user) {
    const token = await issueResetToken(db, user.id);
    const url = absoluteUrl(`/reset-password/${token}`);
    after(() => sendEmail(passwordResetEmail({ to: user.email, name: user.name, url, minutes: RESET_TOKEN_TTL_MINUTES })));
  }
  return { success: parsed.data.email };
}

export async function resetPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  // Hash before opening the transaction so the slow bcrypt work doesn't hold it open.
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const result = await db.$transaction((tx) => consumeResetToken(tx, parsed.data.token, passwordHash));
  if (!result.ok) return { error: "This reset link has expired or was already used. Request a new one." };
  redirect("/login?reset=1");
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
