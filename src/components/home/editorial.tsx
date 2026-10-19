import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common/reveal";

export function Editorial() {
  return (
    <section className="container-page grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <Reveal className="relative lg:col-span-7">
        <div className="grid grid-cols-5 gap-3 lg:gap-4">
          <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-xl bg-muted">
            <Image
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
              alt="Neutral knitwear hanging on a rail beside dried pampas grass"
              fill
              sizes="(min-width: 1024px) 35vw, 60vw"
              className="object-cover"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-3 pt-16 lg:gap-4 lg:pt-24">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
              <Image
                src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80"
                alt="Close-up of a burnished cognac leather derby shoe"
                fill
                sizes="(min-width: 1024px) 22vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="rounded-xl bg-accent-soft p-5 text-accent">
              <p className="font-display text-4xl leading-none">12 yrs</p>
              <p className="mt-2 text-[13px] leading-snug">average lifespan of a Halden leather piece, based on our repair records.</p>
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.1} className="lg:col-span-5">
        <p className="eyebrow text-accent">Made to last</p>
        <h2 className="mt-4 font-display text-display-lg">
          Fewer things, <em>chosen well</em>, worn for years.
        </h2>
        <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
          We started Halden with a simple frustration: the things we loved most never seemed to last. So we work with eleven family-run
          workshops across Portugal, Italy, Japan and England — partners who still measure quality in decades, not drops.
        </p>
        <dl className="mt-10 grid grid-cols-3 gap-6 border-t pt-8">
          {[
            ["11", "partner workshops"],
            ["92%", "natural or recycled fibres"],
            ["4.8", "average review score"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-4xl">{value}</dd>
              <dd className="mt-1 text-[13px] text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
        <Link href="/about" className="group mt-10 inline-flex items-center gap-2 font-medium">
          <span className="link-underline">Read our story</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
}
