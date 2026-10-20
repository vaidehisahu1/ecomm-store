import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { findValidResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";

// The token is in the URL: keep it out of search indexes and Referer headers.
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await findValidResetToken(db, token);

  if (!valid) {
    return (
      <>
        <h1 className="font-display text-display-md">This link has expired</h1>
        <p className="mt-3 text-muted-foreground">Reset links work once and expire after {RESET_TOKEN_TTL_MINUTES} minutes. Request a new one and use the most recent email.</p>
        <Button asChild className="mt-8">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
        <Link href="/login" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-display-md">Choose a new password</h1>
      <p className="mt-3 text-muted-foreground">Pick something you haven’t used here before.</p>
      <ResetPasswordForm token={token} />
    </>
  );
}
