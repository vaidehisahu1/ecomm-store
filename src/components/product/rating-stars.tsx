import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, className, size = 14 }: { rating: number; className?: string; size?: number }) {
  return (
    <span className={cn("relative inline-flex", className)} role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <span className="flex gap-0.5 text-foreground/15">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} style={{ width: size, height: size }} className="fill-current" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-0 flex gap-0.5 overflow-hidden text-accent" style={{ width: `${(rating / 5) * 100}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} style={{ width: size, height: size }} className="shrink-0 fill-current" strokeWidth={0} />
        ))}
      </span>
    </span>
  );
}
