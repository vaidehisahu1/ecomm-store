import Image from "next/image";
import { NewsletterForm } from "@/components/common/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="container-page">
      <div className="relative isolate overflow-hidden rounded-2xl px-6 py-20 text-white sm:px-14 lg:py-28">
        <Image
          src="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="max-w-xl">
          <p className="eyebrow text-white/70">The Halden Letter</p>
          <h2 className="mt-4 font-display text-display-lg">
            10% off your first order, <em>and slower stories</em> after that.
          </h2>
          <p className="mt-5 text-white/75">One thoughtful email a fortnight. Early access to drops, studio notes and care guides.</p>
          <div className="mt-8 max-w-md">
            <NewsletterForm tone="inverse" />
          </div>
        </div>
      </div>
    </section>
  );
}
