export const site = {
  name: "Halden",
  tagline: "Made for the in-between.",
  description:
    "Halden makes considered everyday objects — clothing, leather goods, timepieces and sound — designed in Copenhagen, built to outlast the season.",
  email: "hello@halden.studio",
  phone: "+1 (415) 555-0142",
  address: "214 Valencia Street, San Francisco, CA 94103",
  social: {
    instagram: "https://instagram.com",
    pinterest: "https://pinterest.com",
    youtube: "https://youtube.com",
  },
} as const;

export const mainNav = [
  { label: "Shop all", href: "/shop" },
  { label: "Apparel", href: "/shop?category=apparel" },
  { label: "Footwear", href: "/shop?category=footwear" },
  { label: "Bags", href: "/shop?category=bags" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Sound & Tech", href: "/shop?category=sound-tech" },
  { label: "Home", href: "/shop?category=home-apothecary" },
] as const;

/**
 * Customer-facing policy promises. The product page, the announcement bar and the policy pages all
 * read from here, so a perk can never promise more than the policy says.
 */
export const policies = {
  returns: {
    days: 30,
    summary: "Free US returns on unworn items in original condition",
    exclusions: "Opened apothecary products and pierced jewelry can’t be returned unless faulty.",
  },
  repairs: {
    title: "Lifetime repairs",
    summary: "Free repairs on Halden leather goods and footwear for as long as you own them",
  },
  warranty: {
    years: 2,
    summary: "Two-year warranty on Sound & Tech, with replaceable batteries",
  },
} as const;
