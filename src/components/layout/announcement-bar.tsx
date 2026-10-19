const messages = [
  "Complimentary shipping on orders over $150",
  "New customers: use WELCOME10 for 10% off",
  "Free 30-day returns, no questions asked",
  "Every leather piece is repairable for life",
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
