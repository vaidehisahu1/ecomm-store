"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/common/section-heading";
import type { ProductCardData } from "@/lib/queries";

export function ProductCarousel({ products, eyebrow, title, href }: { products: ProductCardData[]; eyebrow: string; title: React.ReactNode; href: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function scroll(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrow =
    "grid size-11 place-items-center rounded-full border border-foreground/15 transition hover:border-foreground/50 hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-30";

  return (
    <section aria-roledescription="carousel" aria-label={typeof title === "string" ? title : eyebrow}>
      <div className="container-page">
        <SectionHeading eyebrow={eyebrow} title={title} href={href}>
          <div className="hidden gap-2 md:flex">
            <button className={arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label="Previous products">
              <ArrowLeft className="size-4" />
            </button>
            <button className={arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label="Next products">
              <ArrowRight className="size-4" />
            </button>
          </div>
        </SectionHeading>
      </div>
      <ul
        ref={track}
        onScroll={update}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth bleed-inset lg:gap-6"
      >
        {products.map((p, i) => (
          <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[23%]">
            <ProductCard product={p} priority={i < 2} />
          </li>
        ))}
      </ul>
      <div className="container-page mt-8">
        <div className="h-px bg-border">
          <div className="h-px bg-foreground transition-[width] duration-200" style={{ width: `${Math.max(12, progress * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}
