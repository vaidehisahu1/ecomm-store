import { Leaf, Recycle, Ruler, Truck } from "lucide-react";
import { Reveal } from "@/components/common/reveal";

const values = [
  { icon: Ruler, title: "Designed in Copenhagen", body: "Every piece is drawn, sampled and wear-tested by our studio for at least a season." },
  { icon: Recycle, title: "Repairable for life", body: "Send any Halden leather or footwear back and we’ll repair it — free, forever." },
  { icon: Leaf, title: "Better materials", body: "Organic cottons, vegetable-tanned leathers and recycled metals as standard." },
  { icon: Truck, title: "Carbon-neutral delivery", body: "Free over $150, delivered in plastic-free packaging you can actually reuse." },
];

export function ValuesStrip() {
  return (
    <section className="container-page" aria-label="Why Halden">
      <ul className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v, i) => (
          <li key={v.title} className="bg-background">
            <Reveal delay={i * 0.06} className="h-full p-7 lg:p-8">
              <v.icon className="size-5 text-accent" strokeWidth={1.6} />
              <h3 className="mt-5 font-medium">{v.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{v.body}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
