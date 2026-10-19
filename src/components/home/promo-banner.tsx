"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section ref={ref} className="container-page">
      <div className="grain relative grid overflow-hidden rounded-2xl bg-[#1f1b17] text-[#f6f1ea] lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center p-8 py-14 sm:p-14 lg:p-20">
          <p className="eyebrow text-[#f0b597]">The Autumn Edit · Limited time</p>
          <h2 className="mt-5 font-display text-display-lg">
            Twenty percent off <em className="text-[#f0b597]">the pieces</em> you’ll live in.
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/70">
            Spend $250 or more and use code <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[14px] text-white">HALDEN20</span> at checkout. Applies to everything, including new arrivals.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="bg-[#f6f1ea] text-[#1f1b17] hover:bg-white">
              <Link href="/shop?sort=newest">
                Shop the edit <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative min-h-[380px] overflow-hidden lg:min-h-[560px]">
          <motion.div style={{ y }} className="absolute -inset-y-[14%] inset-x-0">
            <Image
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80"
              alt="Model in a saffron tracksuit standing by a basketball hoop"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1f1b17] via-transparent to-transparent max-lg:bg-gradient-to-b" />
        </div>
      </div>
    </section>
  );
}
