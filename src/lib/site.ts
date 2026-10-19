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
