export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantLabel: string;
  /** Unit price in cents */
  price: number;
  quantity: number;
  /** Units available at last sync */
  stock: number;
};

export const MAX_PER_LINE = 10;

export type AppliedPromo = {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotal: number;
};
