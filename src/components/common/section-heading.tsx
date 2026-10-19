import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div>
        {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
        <h2 className="mt-3 font-display text-display-md">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {children}
        {href && (
          <Link href={href} className="group inline-flex items-center gap-2 text-sm font-medium">
            <span className="link-underline">{linkLabel}</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  );
}
