import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { safeRedirect } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const callbackUrl = safeRedirect((await searchParams).callbackUrl);
  if ((await auth())?.user) redirect(callbackUrl);
  return (
    <>
      <p className="eyebrow text-accent">Join Halden</p>
      <h1 className="mt-3 font-display text-display-md">Create your account</h1>
      <p className="mt-3 text-muted-foreground">Enjoy 10% off your first order with code WELCOME10.</p>
      <div className="mt-10">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
