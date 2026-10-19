import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const currencyWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats an integer amount of cents as USD. Whole-dollar amounts drop the decimals. */
export function formatPrice(cents: number) {
  return cents % 100 === 0 ? currencyWhole.format(cents / 100) : currency.format(cents / 100);
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-US", opts).format(new Date(date));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Public origin: explicit config first, then Vercel's production/preview domains, then localhost. */
function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (explicit) {
    return explicit.startsWith("http://") || explicit.startsWith("https://") ? explicit : `https://${explicit}`;
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteOrigin()).toString();
}
