export default function ProductLoading() {
  return (
    <div className="container-page pt-10" aria-busy="true" aria-label="Loading product">
      <div className="skeleton mb-8 h-3 w-48 rounded" />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="grid gap-5 lg:grid-cols-[84px_1fr]">
          <div className="hidden space-y-3 lg:block">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/5] rounded-lg" />
            ))}
          </div>
          <div className="skeleton aspect-[4/5] rounded-2xl" />
        </div>
        <div className="space-y-5 lg:py-4">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-14 w-3/4 rounded-lg" />
          <div className="skeleton h-7 w-32 rounded" />
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton mt-10 h-10 w-40 rounded-full" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-md" />
            ))}
          </div>
          <div className="skeleton h-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
