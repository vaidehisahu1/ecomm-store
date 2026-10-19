"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; alt: string };

export function Gallery({ images, activeIndex, onIndexChange }: { images: GalleryImage[]; activeIndex: number; onIndexChange: (i: number) => void }) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const mobileTrack = useRef<HTMLDivElement>(null);
  const current = images[activeIndex] ?? images[0];

  // Keep the mobile swipe track in sync when the active image changes elsewhere (e.g. colour change).
  useEffect(() => {
    const el = mobileTrack.current;
    if (!el) return;
    const target = activeIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 4) el.scrollTo({ left: target, behavior: "smooth" });
  }, [activeIndex]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  const step = (dir: 1 | -1) => onIndexChange((activeIndex + dir + images.length) % images.length);

  return (
    <div className="lg:grid lg:grid-cols-[84px_1fr] lg:gap-5">
      {/* Thumbnails (desktop) */}
      <ul className="-m-1 hidden max-h-[calc(100vh-10rem)] flex-col gap-3 overflow-y-auto p-1 no-scrollbar lg:flex" aria-label="Product images">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              onClick={() => onIndexChange(i)}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted ring-offset-2 ring-offset-background transition",
                i === activeIndex ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="84px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {/* Main image with hover zoom (desktop) */}
      <div className="relative hidden lg:block">
        <div
          className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={current.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 ease-out"
                style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </motion.div>
          </AnimatePresence>
          <span className="glass pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-3.5" /> Click to expand
          </span>
        </div>
      </div>

      {/* Swipe track (mobile/tablet) */}
      <div className="relative -mx-5 sm:mx-0 lg:hidden">
        <div
          ref={mobileTrack}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-2xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== activeIndex) onIndexChange(i);
          }}
        >
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setLightbox(true)} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-muted" aria-label={`Expand image ${i + 1}`}>
              <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
          {images.map((img, i) => (
            <span key={img.id} className={cn("h-1.5 rounded-full bg-white/90 shadow transition-all", i === activeIndex ? "w-6" : "w-1.5 opacity-60")} />
          ))}
        </div>
      </div>

      <DialogPrimitive.Root open={lightbox} onOpenChange={setLightbox}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/92 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex items-center justify-center outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <DialogPrimitive.Title className="sr-only">Image viewer</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Use the arrow keys to move between images.</DialogPrimitive.Description>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative h-[86vh] w-[min(92vw,calc(86vh*0.8))]"
              >
                <Image src={current.url} alt={current.alt} fill sizes="92vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button onClick={() => step(-1)} className="absolute left-4 grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" aria-label="Previous image">
                  <ChevronLeft className="size-5" />
                </button>
                <button onClick={() => step(1)} className="absolute right-4 grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" aria-label="Next image">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <DialogPrimitive.Close className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" aria-label="Close image viewer">
              <X className="size-5" />
            </DialogPrimitive.Close>
            <p className="absolute bottom-6 text-sm tabular-nums text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
