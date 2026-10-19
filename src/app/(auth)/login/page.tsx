import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirect } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const callbackUrl = safeRedirect((await searchParams).callbackUrl);
  if ((await auth())?.user) redirect(callbackUrl);
  return (
    <>
      <p className="eyebrow text-accent">Welcome back</p>
      <h1 className="mt-3 font-display text-display-md">Sign in to Halden</h1>
      <p className="mt-3 text-muted-foreground">Track orders, save favourites and check out faster.</p>
      <div className="mt-10">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Halden?{" "}
        <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
      <div className="mt-10 rounded-xl border border-dashed p-4 text-[13px] text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p className="mt-1.5 font-mono text-[12px]">user@store.com · User@12345</p>
        <p className="font-mono text-[12px]">admin@store.com · Admin@12345</p>
      </div>
    </>
  );
}
