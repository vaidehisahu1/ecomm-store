"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { login } from "@/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      {state?.error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
        </p>
      )}
      <FormField id="email" label="Email" error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" autoFocus defaultValue={state?.values?.email} />
      </FormField>
      <div className="grid gap-2">
        <FormField id="password" label="Password" error={state?.fieldErrors?.password}>
          <PasswordInput name="password" autoComplete="current-password" />
        </FormField>
        <Link href="/forgot-password" className="justify-self-end text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <>Sign in <ArrowRight /></>}
      </Button>
    </form>
  );
}
