"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { sendContactMessage } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, inputClasses, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const topics = [
  { value: "order", label: "An existing order" },
  { value: "product", label: "Product question" },
  { value: "returns", label: "Returns & repairs" },
  { value: "press", label: "Press & partnerships" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, undefined);

  if (state?.ok) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-10 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h2 className="mt-5 font-display text-3xl">Message received</h2>
        <p className="mt-2 text-muted-foreground">Thanks for reaching out. A real person from our studio will reply within one business day.</p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="grid gap-5 rounded-2xl border bg-card p-6 sm:grid-cols-2 sm:p-10" noValidate>
      <div className="hidden" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <FormField id="name" label="Name" error={state?.fieldErrors?.name}>
        <Input name="name" autoComplete="name" defaultValue={state?.values?.name} />
      </FormField>
      <FormField id="email" label="Email" error={state?.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} />
      </FormField>
      <FormField id="topic" label="Topic" error={state?.fieldErrors?.topic} className="sm:col-span-2">
        <select name="topic" defaultValue={state?.values?.topic || "order"} className={cn(inputClasses, "appearance-none")}>
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="message" label="Message" error={state?.fieldErrors?.message} className="sm:col-span-2">
        <Textarea name="message" rows={6} placeholder="Tell us how we can help. Include your order number if you have one." defaultValue={state?.values?.message} />
      </FormField>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />} Send message
        </Button>
      </div>
    </form>
  );
}
