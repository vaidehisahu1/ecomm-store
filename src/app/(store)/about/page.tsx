import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/common/page-hero";
import { Reveal } from "@/components/common/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our story",
  description: "Halden was founded in Copenhagen in 2016 to make fewer, better everyday objects — and to repair them for life.",
};

const milestones = [
  ["2016", "Founded in a Nørrebro basement with one product: a bridle-leather wallet."],
  ["2018", "First footwear collection, made with a fourth-generation workshop in Northampton."],
  ["2020", "Launched our lifetime repair programme. Over 14,000 pieces mended since."],
  ["2023", "Introduced Sound & Tech — audio tuned in Copenhagen, built to be serviced."],
  ["2025", "Opened our first US studio in San Francisco’s Mission District."],
];

const principles = [
  { title: "Fewer, better", body: "We release two small collections a year. If a piece isn’t better than what already exists, we don’t make it." },
  { title: "Made by name", body: "We know every workshop we work with by name, visit each at least once a year, and publish our supplier list." },
  { title: "Repair over replace", body: "Leather goods and footwear are repaired free for life. Electronics come with replaceable batteries and five years of parts." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={<>Things made for the <em>long middle</em> of life.</>}
        intro={<p>Halden is a small studio in Copenhagen and San Francisco making clothing, leather goods and quiet technology for the everyday hours that don’t get photographed — the commute, the long lunch, the walk home.</p>}
      />
      <Reveal className="container-page">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted lg:aspect-[21/9]">
          <Image src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2400&q=80" alt="Warm-toned garments hanging in the Halden studio" fill priority sizes="100vw" className="object-cover" />
        </div>
      </Reveal>

      <section className="container-page mt-24 grid gap-12 lg:mt-36 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow text-accent">What we believe</p>
          <h2 className="mt-4 font-display text-display-md">
            Quality is a <em>promise you keep</em> for years.
          </h2>
        </div>
        <div className="space-y-10 lg:col-span-6 lg:col-start-7">
          {principles.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} className="flex gap-6 border-t pt-8">
              <span className="font-display text-4xl text-accent">0{i + 1}</span>
              <div>
                <h3 className="text-xl font-medium">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 bg-foreground py-24 text-background lg:mt-36 lg:py-32">
        <div className="container-page">
          <p className="eyebrow text-background/60">Milestones</p>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {milestones.map(([year, text], i) => (
              <li key={year} className="border-t border-background/20 pt-6">
                <Reveal delay={i * 0.06}>
                  <p className="font-display text-5xl">{year}</p>
                  <p className="mt-4 text-[15px] leading-relaxed text-background/70">{text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page mt-24 grid items-center gap-12 lg:mt-36 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <Image src="https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80" alt="A full-grain leather rucksack" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="font-display text-display-md">
            Come visit the <em>studio</em>.
          </h2>
          <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
            Try things on, bring a piece in for repair, or just come for coffee. Our San Francisco studio is open six days a week on Valencia Street.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/shop">
                Shop the collection <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
