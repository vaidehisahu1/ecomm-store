import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/common/page-hero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = { title: "FAQ", description: "Answers to common questions about orders, sizing, shipping, returns, repairs and care." };

const sections = [
  {
    id: "orders",
    title: "Orders & payment",
    items: [
      ["Which payment methods do you accept?", "We accept all major credit and debit cards, Apple Pay and PayPal. Payments are processed securely and we never store your full card details."],
      ["Can I change or cancel my order?", "Orders can be changed or cancelled within one hour of being placed. After that our studio begins packing — contact us and we’ll do our best."],
      ["Do you offer gift wrapping?", "Every order ships in our signature recycled-card box with tissue. Add a gift note at checkout and we’ll handwrite it."],
    ],
  },
  {
    id: "sizing",
    title: "Sizing & fit",
    items: [
      ["How do your clothes fit?", "Our tops are cut with a relaxed, slightly boxy fit. If you prefer a closer fit, we recommend sizing down. Each product page lists the fit and model measurements."],
      ["How do your shoes size?", "Our footwear uses EU sizing and runs true to size. If you’re between sizes, choose the larger size for derbies and brogues and your usual size for sneakers."],
      ["What if something doesn’t fit?", "Exchanges are free within 30 days. Start an exchange from your order page and we’ll ship the new size as soon as your return is scanned."],
    ],
  },
  {
    id: "repairs",
    title: "Care & repairs",
    items: [
      ["What does the lifetime repair programme cover?", "All Halden leather goods and footwear can be sent back for free repair of stitching, hardware, edges and soles for as long as you own them. Shipping is on us."],
      ["How should I care for vegetable-tanned leather?", "Wipe with a dry cloth, condition every six months with a neutral balm, and let it dry naturally if it gets wet. Patina is part of the beauty."],
      ["Do electronics have a warranty?", "Sound & Tech products include a two-year warranty, replaceable batteries and five years of spare-parts availability."],
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="Help centre" title={<>Questions, <em>answered</em>.</>} intro={<p>Can’t find what you’re looking for? <Link href="/contact" className="text-foreground underline underline-offset-4">Write to us</Link> — we reply within a day.</p>} />
      <div className="container-page grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-20">
        <nav aria-label="FAQ sections" className="hidden lg:block">
          <ul className="sticky top-28 space-y-3 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground transition hover:text-foreground">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="font-display text-display-sm">{s.title}</h2>
              <Accordion type="single" collapsible className="mt-4 border-t">
                {s.items.map(([q, a]) => (
                  <AccordionItem key={q} value={q}>
                    <AccordionTrigger>{q}</AccordionTrigger>
                    <AccordionContent>{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
