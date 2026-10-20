import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirect } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ callbackUrl?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const callbackUrl = safeRedirect(sp.callbackUrl);
  if ((await auth())?.user) redirect(callbackUrl);
  return (
    <>
      <p className="eyebrow text-accent">Welcome back</p>
      <h1 className="mt-3 font-display text-display-md">Sign in to Halden</h1>
      <p className="mt-3 text-muted-foreground">Track orders, save favourites and check out faster.</p>
      {sp.reset === "1" && (
        <p role="status" className="mt-6 rounded-lg border border-success/30 bg-success/[0.06] p-3.5 text-sm text-success">
          Your password has been updated. Sign in with your new password.
        </p>
      )}
      <div className="mt-10">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Halden?{" "}
        <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
