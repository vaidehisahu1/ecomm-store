"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { RatingStars } from "@/components/product/rating-stars";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote: "I’ve bought cheaper headphones and more expensive ones. The Halden One is the first pair I’ve not wanted to replace. The sound is warm, the fit is perfect, and they look like an object, not a gadget.",
    name: "Daniel Osei",
    detail: "Bought Halden One Headphones",
    avatar: "1507003211169-0a1dd7228f2d",
  },
  {
    quote: "The Arc Crossbody has been everywhere with me this year — weddings, flights, the farmer’s market. The leather has softened beautifully. Their customer team even sent a care kit unprompted.",
    name: "Sofia Martín",
    detail: "Bought Arc Crossbody",
    avatar: "1494790108377-be9c29b29330",
  },
  {
    quote: "Rare to find a brand that gets the details right. The heavyweight tee holds its shape after dozens of washes, and the shipping box was so nice I kept it.",
    name: "Hannah Lindgren",
    detail: "Bought Everyday Heavyweight Tee",
    avatar: "1438761681033-6461ffad8d80",
  },
  {
    quote: "My Atelier Derbies are three years old and just came back from their first free resole. They look better than new. That repair promise is real.",
    name: "Marco Bellini",
    detail: "Bought Atelier Derby",
    avatar: "1500648767791-00dcc994a43e",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const t = testimonials[index];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 7000);
    return () => window.clearInterval(id);
  }, [paused]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + testimonials.length) % testimonials.length);

  return (
    <section
      className="container-page"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="eyebrow text-accent">In their words</p>
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <RatingStars rating={4.8} size={16} />
          <span>4.8 from 2,400+ verified reviews</span>
        </div>
        <div className="relative mt-10 min-h-[260px] sm:min-h-[220px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.2]">“{t.quote}”</blockquote>
              <figcaption className="mt-10 flex items-center justify-center gap-4">
                <span className="relative size-12 overflow-hidden rounded-full bg-muted">
                  <Image src={`https://images.unsplash.com/photo-${t.avatar}?auto=format&fit=crop&w=160&h=160&q=80`} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="text-left">
                  <span className="block font-medium">{t.name}</span>
                  <span className="block text-sm text-muted-foreground">{t.detail}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6">
          <button onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full border transition hover:bg-foreground hover:text-background" aria-label="Previous review">
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === index}
                className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-8 bg-foreground" : "w-1.5 bg-foreground/20 hover:bg-foreground/40")}
              />
            ))}
          </div>
          <button onClick={() => go(1)} className="grid size-10 place-items-center rounded-full border transition hover:bg-foreground hover:text-background" aria-label="Next review">
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
