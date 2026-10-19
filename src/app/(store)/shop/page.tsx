import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Filters } from "@/components/shop/filters";
import { Pagination } from "@/components/shop/pagination";
import { PendingResults, ShopStateProvider } from "@/components/shop/shop-state";
import { Toolbar } from "@/components/shop/toolbar";
import { Button } from "@/components/ui/button";
import { parseCatalogParams } from "@/lib/catalog";
import { getCatalog, getCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseCatalogParams(await searchParams);
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === params.category);
  if (params.q) return { title: `Search: ${params.q}`, robots: { index: false } };
  if (category) return { title: category.name, description: category.description, alternates: { canonical: `/shop?category=${category.slug}` } };
  return { title: "Shop all", description: "Clothing, footwear, leather goods, accessories and quiet technology from Halden.", alternates: { canonical: "/shop" } };
}

export default async function ShopPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseCatalogParams(raw);
  const [categories, catalog] = await Promise.all([getCategories(), getCatalog(params)]);
  const category = categories.find((c) => c.slug === params.category);
  const flatParams = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

  return (
    <ShopStateProvider>
      <section className="border-b">
        <div className="container-page pb-10 pt-14 lg:pb-14 lg:pt-20">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
            <ol className="flex gap-2">
              <li>
                <Link href="/" className="hover:text-foreground">Home</Link>
              </li>
              <li aria-hidden>/</li>
              <li>{category ? <Link href="/shop" className="hover:text-foreground">Shop</Link> : <span aria-current="page">Shop</span>}</li>
              {category && (
                <>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="text-foreground">{category.name}</li>
                </>
              )}
            </ol>
          </nav>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-display text-display-xl">
                {params.q ? (
                  <>
                    Results for <em>“{params.q}”</em>
                  </>
                ) : category ? (
                  category.name
                ) : (
                  <>
                    The <em>collection</em>
                  </>
                )}
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
                {category?.description ?? "Everyday essentials, made by people who care how long things last."}
              </p>
            </div>
          </div>
          <ul className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categories">
            {[{ slug: "", name: "All" }, ...categories].map((c) => {
              const active = (params.category ?? "") === c.slug;
              return (
                <li key={c.slug || "all"} className="shrink-0">
                  <Link
                    href={c.slug ? `/shop?category=${c.slug}` : "/shop"}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full border px-5 text-[14px] transition",
                      active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40",
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="container-page grid gap-10 pt-8 lg:grid-cols-[240px_1fr] lg:gap-14 lg:pt-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">
            <Filters categories={categories} total={catalog.total} />
          </div>
        </aside>
        <div>
          <Toolbar categories={categories} total={catalog.total} />
          <PendingResults>
            {catalog.products.length > 0 ? (
              <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
                {catalog.products.map((p, i) => (
                  <li key={p.id}>
                    <ProductCard product={p} priority={i < 3} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-24 text-center">
                <SearchX className="size-10 text-muted-foreground" strokeWidth={1.4} />
                <h2 className="mt-6 font-display text-4xl">Nothing quite matches</h2>
                <p className="mt-2 max-w-sm text-muted-foreground">Try removing a filter or searching for something broader.</p>
                <Button asChild variant="outline" className="mt-8">
                  <Link href="/shop">Reset filters</Link>
                </Button>
              </div>
            )}
            <Pagination page={catalog.page} pages={catalog.pages} searchParams={flatParams} />
          </PendingResults>
        </div>
      </div>
    </ShopStateProvider>
  );
}
