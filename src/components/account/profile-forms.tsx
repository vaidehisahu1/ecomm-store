"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword, updateProfile } from "@/actions/account";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  useEffect(() => {
    if (state?.ok) toast.success("Profile updated");
  }, [state]);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      <FormField id="name" label="Full name" error={state?.fieldErrors?.name}>
        <Input name="name" defaultValue={name} autoComplete="name" />
      </FormField>
      <FormField id="phone" label="Phone" error={state?.fieldErrors?.phone}>
        <Input name="phone" defaultValue={phone} autoComplete="tel" type="tel" />
      </FormField>
      <FormField id="email" label="Email" hint="Contact us to change the email on your account." className="sm:col-span-2">
        <Input value={email} readOnly disabled />
      </FormField>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      toast.success("Password updated");
      formRef.current?.reset();
    }
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      <FormField id="currentPassword" label="Current password" error={state?.fieldErrors?.currentPassword} className="sm:col-span-2">
        <PasswordInput name="currentPassword" autoComplete="current-password" />
      </FormField>
      <FormField id="newPassword" label="New password" error={state?.fieldErrors?.newPassword}>
        <PasswordInput name="newPassword" autoComplete="new-password" />
      </FormField>
      <FormField id="confirmPassword" label="Confirm new password" error={state?.fieldErrors?.confirmPassword}>
        <PasswordInput name="confirmPassword" autoComplete="new-password" />
      </FormField>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Update password
        </Button>
      </div>
    </form>
  );
}
