import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, intro, className }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("container-page pb-12 pt-16 lg:pb-20 lg:pt-24", className)}>
      <p className="eyebrow text-accent">{eyebrow}</p>
      <h1 className="mt-5 max-w-4xl font-display text-display-xl">{title}</h1>
      {intro && <div className="mt-6 max-w-2xl text-[18px] leading-relaxed text-muted-foreground">{intro}</div>}
    </section>
  );
}
