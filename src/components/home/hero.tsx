"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export type HeroSpotlight = { slug: string; name: string; price: number; image: string };

export function Hero({ spotlight }: { spotlight: HeroSpotlight | null }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const words = ["Made", "for", "the"];

  return (
    <section ref={ref} className="relative isolate h-[calc(100svh-6.5rem)] min-h-[560px] overflow-hidden bg-[#1c1916] text-white lg:h-[calc(100svh-7rem)]">
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-10">
        <motion.div initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease }} className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2400&q=80"
            alt="A woman in a pale blue coat in a city square at dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_25%]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />
      </motion.div>

      <motion.div style={{ y: textY, opacity: fade }} className="container-page flex h-full flex-col justify-end pb-14 lg:pb-20">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease }} className="eyebrow text-white/80">
          Autumn / Winter Collection
        </motion.p>
        <h1 className="mt-5 max-w-5xl font-display text-display-2xl tracking-[-0.02em]">
          <span className="sr-only">Made for the in-between.</span>
          <span aria-hidden>
            {words.map((w, i) => (
              <span key={w} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.4 + i * 0.08, ease }}>
                  {w}
                </motion.span>
              </span>
            ))}
            <br className="hidden sm:block" />
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.em className="inline-block pr-2 text-[#f0b597]" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.66, ease }}>
                in-between.
              </motion.em>
            </span>
          </span>
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95, ease }}
          className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-md">
            <p className="text-[17px] leading-relaxed text-white/80">
              Clothing, leather and quiet technology for the hours between home and away — designed in Copenhagen, made to outlast the season.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                <Link href="/shop">
                  Shop the collection <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/35 text-white hover:border-white/70 hover:bg-white/10">
                <Link href="/about">Our story</Link>
              </Button>
            </div>
          </div>

          {spotlight && (
            <Link
              href={`/product/${spotlight.slug}`}
              className="group hidden w-80 items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-3 pr-5 backdrop-blur-xl transition hover:bg-white/15 md:flex"
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
                <Image src={spotlight.image} alt="" fill sizes="80px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block text-white/60">Just landed</span>
                <span className="mt-1 block truncate font-medium">{spotlight.name}</span>
                <span className="block text-sm text-white/70">{formatPrice(spotlight.price)}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
