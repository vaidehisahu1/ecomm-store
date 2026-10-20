import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_LIMITS } from "@/lib/rate-limit";

/** Static check that each documented entry point actually calls its limiter. */
const wiring: [file: string, limiter: keyof typeof RATE_LIMITS][] = [
  ["src/actions/auth.ts", "login"],
  ["src/actions/auth.ts", "register"],
  ["src/actions/auth.ts", "passwordReset"],
  ["src/auth.ts", "credentials"],
  ["src/actions/contact.ts", "contact"],
  ["src/actions/newsletter.ts", "newsletter"],
  ["src/actions/checkout.ts", "promo"],
  ["src/app/api/search/route.ts", "search"],
];

describe("rate limit wiring", () => {
  it.each(wiring)("%s applies the %s limiter", (file, limiter) => {
    expect(readFileSync(file, "utf8")).toContain(`rateLimit("${limiter}"`);
  });

  it("every configured limiter is wired somewhere", () => {
    expect(new Set(wiring.map(([, l]) => l))).toEqual(new Set(Object.keys(RATE_LIMITS)));
  });
});
