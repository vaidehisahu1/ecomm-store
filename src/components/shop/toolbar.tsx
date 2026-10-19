"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Filters } from "@/components/shop/filters";
import { useShopState } from "@/components/shop/shop-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PRICE_CEILING, sortOptions } from "@/lib/catalog";

type Category = { slug: string; name: string; _count: { products: number } };

export function Toolbar({ categories, total }: { categories: Category[]; total: number }) {
  const { params, update } = useShopState();
  const sort = params.get("sort") ?? "featured";

  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];
  const cat = categories.find((c) => c.slug === params.get("category"));
  if (cat) chips.push({ key: "category", label: cat.name, clear: { category: null } });
  if (params.get("q")) chips.push({ key: "q", label: `“${params.get("q")}”`, clear: { q: null } });
  if (params.get("min") || params.get("max"))
    chips.push({
      key: "price",
      label: `$${params.get("min") ?? 0} – $${params.get("max") ?? `${PRICE_CEILING}+`}`,
      clear: { min: null, max: null },
    });
  if (params.get("rating")) chips.push({ key: "rating", label: `${params.get("rating")}★ & up`, clear: { rating: null } });
  if (params.get("inStock")) chips.push({ key: "inStock", label: "In stock", clear: { inStock: null } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal /> Filters
              {chips.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-foreground text-[11px] text-background">{chips.length}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="overflow-y-auto px-6 pb-10 pt-6">
            <SheetTitle className="mb-6 font-display text-3xl">Filters</SheetTitle>
            <SheetDescription className="sr-only">Narrow down products</SheetDescription>
            <Filters categories={categories} total={total} />
          </SheetContent>
        </Sheet>
        <p className="hidden text-sm text-muted-foreground lg:block" aria-live="polite">
          Showing <span className="text-foreground tabular-nums">{total}</span> {total === 1 ? "product" : "products"}
        </p>
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="hidden text-sm text-muted-foreground sm:block">
            Sort by
          </label>
          <Select value={sort} onValueChange={(v) => update({ sort: v === "featured" ? null : v })}>
            <SelectTrigger id="sort" className="h-11 w-[200px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.key}>
              <button
                onClick={() => update(c.clear)}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] py-1.5 pl-3.5 pr-2.5 text-[13px] transition hover:bg-foreground/10"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <X className="size-3.5" />
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => update({ category: null, q: null, min: null, max: null, rating: null, inStock: null })}
              className="px-2 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
