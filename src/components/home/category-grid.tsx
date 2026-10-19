import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; image: string; _count: { products: number } };

// Bento layout: the first category gets a tall hero tile; the rest flow around it.
const layout = [
  "md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto",
  "aspect-[4/3] md:aspect-auto",
  "aspect-[4/3] md:aspect-auto",
  "aspect-[4/3] md:aspect-auto",
  "aspect-[4/3] md:aspect-auto",
  "sm:col-span-2 md:col-span-4 aspect-[16/9] md:aspect-auto",
];

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:auto-rows-[260px] md:grid-cols-4 lg:auto-rows-[300px] lg:gap-4">
      {categories.slice(0, 6).map((c, i) => (
        <Reveal key={c.slug} delay={i * 0.06} className={cn("relative", layout[i])}>
          <Link href={`/shop?category=${c.slug}`} className="group absolute inset-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={c.image}
              alt=""
              fill
              sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
              className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white lg:inset-x-6 lg:bottom-6">
              <div>
                <p className="text-[12px] text-white/70 tabular-nums">{c._count.products} pieces</p>
                <h3 className={cn("font-display leading-none", i === 0 ? "text-5xl lg:text-6xl" : "text-3xl lg:text-4xl")}>{c.name}</h3>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-black">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
