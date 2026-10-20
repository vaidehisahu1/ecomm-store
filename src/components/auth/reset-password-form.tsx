"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { resetPassword } from "@/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {state.error}{" "}
            <Link href="/forgot-password" className="underline underline-offset-2">
              Request a new link
            </Link>
          </span>
        </p>
      )}
      <FormField id="password" label="New password" error={state?.fieldErrors?.password} hint="8+ characters with upper and lowercase letters and a number.">
        <PasswordInput name="password" autoComplete="new-password" autoFocus />
      </FormField>
      <FormField id="confirmPassword" label="Confirm new password" error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : "Set new password"}
      </Button>
    </form>
  );
}
