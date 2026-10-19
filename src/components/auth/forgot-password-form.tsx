"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
        <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-display-md">Check your inbox</h1>
        <p className="mt-3 text-muted-foreground">
          If an account exists for <span className="text-foreground">{state.success}</span>, we’ve sent a link to reset your password. It expires in 30 minutes.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/login">
            <ArrowLeft /> Back to sign in
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <h1 className="font-display text-display-md">Reset your password</h1>
      <p className="mt-3 text-muted-foreground">Enter the email you use for Halden and we’ll send you a secure reset link.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        <FormField id="email" label="Email" error={state?.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="email" autoFocus defaultValue={state?.values?.email} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : "Send reset link"}
        </Button>
      </form>
      <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </>
  );
}
