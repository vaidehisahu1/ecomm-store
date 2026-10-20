import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/product/rating-stars";
import { ReviewForm } from "@/components/product/review-form";
import { Button } from "@/components/ui/button";
import { formatDate, initials } from "@/lib/utils";

type Review = { id: string; rating: number; title: string; body: string; createdAt: Date; verified: boolean; user: { name: string } };

export function Reviews({
  productId,
  slug,
  rating,
  reviews,
  signedIn,
}: {
  productId: string;
  slug: string;
  rating: number;
  reviews: Review[];
  signedIn: boolean;
}) {
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-20">
      <div className="space-y-8">
        <div>
          <p className="font-display text-7xl leading-none">{reviews.length ? rating.toFixed(1) : "—"}</p>
          <RatingStars rating={rating} size={18} className="mt-3" />
          <p className="mt-2 text-sm text-muted-foreground">Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
        <ul className="space-y-2.5" aria-label="Rating distribution">
          {distribution.map((d) => (
            <li key={d.star} className="flex items-center gap-3 text-sm">
              <span className="w-3 tabular-nums">{d.star}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
              </span>
              <span className="w-6 text-right tabular-nums text-muted-foreground">{d.count}</span>
            </li>
          ))}
        </ul>
        {signedIn ? (
          <ReviewForm productId={productId} />
        ) : (
          <div className="rounded-xl border bg-card p-6">
            <p className="font-medium">Own this piece?</p>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to share your experience with the community.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href={`/login?callbackUrl=/product/${slug}%23reviews`}>Sign in to review</Link>
            </Button>
          </div>
        )}
      </div>

      <ul className="divide-y">
        {reviews.length === 0 && <li className="py-10 text-muted-foreground">No reviews yet — be the first to share your thoughts.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="py-8 first:pt-0">
            <article>
              <div className="flex items-center justify-between gap-4">
                <RatingStars rating={r.rating} />
                <time dateTime={r.createdAt.toISOString()} className="text-[13px] text-muted-foreground">
                  {formatDate(r.createdAt)}
                </time>
              </div>
              <h3 className="mt-4 text-lg font-medium">{r.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{r.body}</p>
              <footer className="mt-5 flex items-center gap-3 text-sm">
                <span className="grid size-8 place-items-center rounded-full bg-muted text-[11px] font-semibold">{initials(r.user.name)}</span>
                <span>{r.user.name}</span>
                {r.verified && (
                  <span className="flex items-center gap-1 text-[12px] text-success" title="Bought this product in a paid order">
                    <BadgeCheck className="size-3.5" /> Verified buyer
                  </span>
                )}
              </footer>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
