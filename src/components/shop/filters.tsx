"use client";

import { useEffect, useId, useState } from "react";
import { Star } from "lucide-react";
import { useShopState } from "@/components/shop/shop-state";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PRICE_CEILING } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; _count: { products: number } };

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b py-7 first:pt-0">
      <legend className="eyebrow float-left mb-5 w-full text-muted-foreground">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function Filters({ categories, total }: { categories: Category[]; total: number }) {
  const { params, update } = useShopState();
  const stockId = useId();
  const category = params.get("category") ?? "";
  const rating = Number(params.get("rating") ?? 0);
  const inStock = params.get("inStock") === "1";
  const urlMin = Number(params.get("min") ?? 0);
  const urlMax = Number(params.get("max") ?? PRICE_CEILING);
  const [price, setPrice] = useState<[number, number]>([urlMin, urlMax]);

  useEffect(() => setPrice([urlMin, urlMax]), [urlMin, urlMax]);

  const optionClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[14px] transition-colors",
      active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground",
    );

  return (
    <div>
      <FilterGroup title="Category">
        <ul className="-mx-3 space-y-0.5">
          <li>
            <button className={optionClass(!category)} onClick={() => update({ category: null })} aria-pressed={!category}>
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button className={optionClass(category === c.slug)} onClick={() => update({ category: c.slug })} aria-pressed={category === c.slug}>
                {c.name}
                <span className="text-[12px] tabular-nums opacity-60">{c._count.products}</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <Slider
          min={0}
          max={PRICE_CEILING}
          step={10}
          minStepsBetweenThumbs={5}
          value={price}
          onValueChange={(v) => setPrice([v[0], v[1]])}
          onValueCommit={(v) => update({ min: v[0] > 0 ? String(v[0]) : null, max: v[1] < PRICE_CEILING ? String(v[1]) : null })}
          thumbLabels={["Minimum price", "Maximum price"]}
        />
        <div className="mt-4 flex items-center justify-between text-[13px] tabular-nums">
          <span className="rounded-md border px-2.5 py-1">${price[0]}</span>
          <span className="h-px w-6 bg-border" />
          <span className="rounded-md border px-2.5 py-1">
            ${price[1]}
            {price[1] === PRICE_CEILING && "+"}
          </span>
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="-mx-3 space-y-0.5">
          {[4, 3].map((r) => (
            <button key={r} className={optionClass(rating === r)} onClick={() => update({ rating: rating === r ? null : String(r) })} aria-pressed={rating === r}>
              <span className="flex items-center gap-2">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("size-3.5", i < r ? "fill-current" : "opacity-25")} strokeWidth={0} fill="currentColor" />
                  ))}
                </span>
                & up
              </span>
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="flex items-center justify-between">
          <Label htmlFor={stockId} className="text-[14px] font-normal">
            In stock only
          </Label>
          <Switch id={stockId} checked={inStock} onCheckedChange={(v) => update({ inStock: v ? "1" : null })} />
        </div>
      </FilterGroup>

      <p className="pt-6 text-[13px] text-muted-foreground" aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
    </div>
  );
}
