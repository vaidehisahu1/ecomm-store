import { z } from "zod";

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export const PAGE_SIZE = 12;
export const PRICE_CEILING = 1500;

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional().catch(undefined));

/** Parses and sanitises the shop page's URL search params. Invalid values are dropped, never thrown. */
export const catalogParamsSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  min: optionalInt(0, PRICE_CEILING),
  max: optionalInt(0, PRICE_CEILING),
  rating: optionalInt(1, 5),
  inStock: z.preprocess((v) => v === "1" || v === "true", z.boolean()).catch(false),
  sort: z.enum(sortOptions.map((o) => o.value) as [SortValue, ...SortValue[]]).catch("featured"),
  page: optionalInt(1, 1000),
});

export type CatalogParams = z.infer<typeof catalogParamsSchema>;

export function parseCatalogParams(raw: Record<string, string | string[] | undefined>): CatalogParams {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return catalogParamsSchema.parse(flat);
}
