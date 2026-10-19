import { ProductCardSkeleton } from "@/components/product/product-card";

export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="border-b">
        <div className="container-page pb-14 pt-20">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton mt-8 h-16 w-2/3 max-w-xl rounded-lg" />
          <div className="skeleton mt-5 h-4 w-1/2 max-w-md rounded" />
          <div className="mt-10 flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="container-page grid gap-14 pt-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-8 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
