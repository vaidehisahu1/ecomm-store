import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, searchParams }: { page: number; pages: number; searchParams: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(searchParams).filter((e): e is [string, string] => Boolean(e[1])));
    if (p === 1) qs.delete("page");
    else qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const items = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  const nav = "grid size-11 place-items-center rounded-full border transition hover:border-foreground/40";

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={nav} aria-label="Previous page" scroll>
          <ArrowLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(nav, "opacity-30")} aria-hidden>
          <ArrowLeft className="size-4" />
        </span>
      )}
      {items.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && items[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn("grid size-11 place-items-center rounded-full text-sm tabular-nums transition", p === page ? "bg-foreground text-background" : "hover:bg-foreground/[0.06]")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={nav} aria-label="Next page">
          <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(nav, "opacity-30")} aria-hidden>
          <ArrowRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
