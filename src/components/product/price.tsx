import { cn, formatPrice } from "@/lib/utils";

export function Price({ price, compareAt, className }: { price: number; compareAt?: number | null; className?: string }) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span className={cn(onSale && "text-accent")}>{formatPrice(price)}</span>
      {onSale && (
        <>
          <span className="sr-only">, reduced from</span>
          <s className="text-[0.85em] text-muted-foreground">{formatPrice(compareAt)}</s>
        </>
      )}
    </span>
  );
}
