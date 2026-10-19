"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { register } from "@/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const rules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
];

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const [password, setPassword] = useState("");
  const score = rules.filter((r) => r.test(password)).length;

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      {state?.error && (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
        </p>
      )}
      <FormField id="name" label="Full name" error={state?.fieldErrors?.name}>
        <Input name="name" autoComplete="name" autoFocus defaultValue={state?.values?.name} />
      </FormField>
      <FormField id="email" label="Email" error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} />
      </FormField>
      <div className="grid gap-3">
        <FormField id="password" label="Password" error={state?.fieldErrors?.password}>
          <PasswordInput name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <div className="flex gap-1.5" aria-hidden>
          {rules.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i < score ? (score === 4 ? "bg-success" : "bg-warning") : "bg-foreground/10")} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-1.5 text-[12px]" aria-label="Password requirements">
          {rules.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.label} className={cn("flex items-center gap-1.5 transition-colors", ok ? "text-success" : "text-muted-foreground")}>
                <Check className={cn("size-3.5", !ok && "opacity-30")} /> {r.label}
              </li>
            );
          })}
        </ul>
      </div>
      <FormField id="confirmPassword" label="Confirm password" error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <>Create account <ArrowRight /></>}
      </Button>
    </form>
  );
}
