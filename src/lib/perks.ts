import { countries } from "@/lib/countries";
import { deliveryOptions, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { policies } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

/** Perks shown on product pages, built from the same constants the policy pages and checkout use. */
export const productPerks = [
  {
    key: "shipping",
    title: `Free standard shipping over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
    body: `Standard delivery in ${deliveryOptions.STANDARD.eta}`,
  },
  { key: "returns", title: `${policies.returns.days}-day returns`, body: policies.returns.summary },
  { key: "repairs", title: policies.repairs.title, body: "On Halden leather goods and footwear" },
  { key: "warranty", title: `${policies.warranty.years}-year warranty`, body: "On all Sound & Tech products" },
] as const;

export type PerkKey = (typeof productPerks)[number]["key"];

export const shippingCountryCount = countries.length;
