import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { policies } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

const messages = [
  `Free standard shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
  "New customers: use WELCOME10 for 10% off",
  `Free ${policies.returns.days}-day returns on unworn items`,
  "Free lifetime repairs on leather goods and footwear",
];

export function AnnouncementBar() {
  const row = [...messages, ...messages];
  return (
    <div className="overflow-hidden bg-foreground text-background" role="region" aria-label="Store announcements">
      <div className="flex w-max animate-marquee py-2.5 hover:[animation-play-state:paused]">
        {[0, 1].map((dup) => (
          <ul key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
            {row.map((m, i) => (
              <li key={i} className="flex items-center whitespace-nowrap px-8 text-[12px] tracking-wide">
                <span className="mr-8 size-1 rounded-full bg-accent" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
