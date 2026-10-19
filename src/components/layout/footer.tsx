import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NewsletterForm } from "@/components/common/newsletter-form";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "New in", href: "/shop?sort=newest" },
      { label: "Apparel", href: "/shop?category=apparel" },
      { label: "Footwear", href: "/shop?category=footwear" },
      { label: "Bags & Leather", href: "/shop?category=bags" },
      { label: "Accessories", href: "/shop?category=accessories" },
      { label: "Sound & Tech", href: "/shop?category=sound-tech" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "Track an order", href: "/account/orders" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Halden",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Your account", href: "/account" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const payments = ["Visa", "Mastercard", "Amex", "Apple Pay", "PayPal"];

export function Footer() {
  return (
    <footer className="mt-32 border-t bg-card/40">
      <div className="container-page grid gap-14 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-5">
          <Logo className="h-5" />
          <p className="mt-6 max-w-sm font-display text-3xl leading-tight">
            Letters from the studio — new pieces, slow stories, early access.
          </p>
          <div className="mt-8 max-w-md">
            <NewsletterForm />
          </div>
          <p className="mt-3 max-w-md text-xs text-muted-foreground">
            By subscribing you agree to our <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>. Unsubscribe anytime.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="eyebrow text-muted-foreground">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14px] text-foreground/80 transition-colors hover:text-foreground link-underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 sm:col-span-3">
            <p className="eyebrow text-muted-foreground">Studio</p>
            <address className="mt-4 text-[14px] not-italic leading-relaxed text-foreground/80">
              {site.address}
              <br />
              {site.email} · {site.phone}
            </address>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-5 py-7 text-[13px] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} Studio ApS. {site.tagline}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Accepted payment methods">
            {payments.map((p) => (
              <li key={p} className="rounded-md border px-2.5 py-1 text-[11px] font-medium tracking-wide">
                {p}
              </li>
            ))}
          </ul>
          <ul className="flex gap-5">
            {Object.entries(site.social).map(([name, href]) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noreferrer" className="capitalize transition-colors hover:text-foreground">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Oversized wordmark sign-off */}
      <div className="container-page overflow-hidden pb-6" aria-hidden>
        <Logo withMark={false} className="h-auto w-full text-foreground/[0.06]" />
      </div>
    </footer>
  );
}
