"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { submitReview } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const labels = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  if (state?.ok) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 rounded-xl border bg-card p-6" role="status">
        <CheckCircle2 className="size-6 shrink-0 text-success" />
        <div>
          <p className="font-medium">Thank you for your review</p>
          <p className="mt-1 text-sm text-muted-foreground">It’s now live on this page and helps others choose well.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-xl border bg-card p-6 sm:p-8" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="text-[13px] font-medium text-foreground/85">Your rating</legend>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star className={cn("size-7 transition-colors", n <= shown ? "fill-accent text-accent" : "text-foreground/20")} strokeWidth={1.2} />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{labels[shown]}</span>
        </div>
        {state?.fieldErrors?.rating && (
          <p role="alert" className="mt-2 text-[13px] text-destructive">
            {state.fieldErrors.rating}
          </p>
        )}
      </fieldset>
      <FormField id="review-title" label="Headline" error={state?.fieldErrors?.title}>
        <Input name="title" placeholder="Sum it up in a few words" maxLength={80} defaultValue={state?.values?.title} />
      </FormField>
      <FormField id="review-body" label="Your review" error={state?.fieldErrors?.body}>
        <Textarea name="body" placeholder="How does it fit, feel and wear?" maxLength={2000} defaultValue={state?.values?.body} />
      </FormField>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Submit review
      </Button>
    </form>
  );
}
