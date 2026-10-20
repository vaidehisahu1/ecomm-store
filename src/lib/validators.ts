import { z } from "zod";
import { mockPaymentSchema } from "@/lib/payments/mock-card";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+()\d\s-]*$/, "Use digits, spaces and + ( ) - only")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).default("Home"),
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  line1: z.string().trim().min(3, "Enter a street address").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(60),
  state: z.string().trim().min(2, "Enter a state or region").max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,10}$/, "Enter a valid postal code"),
  country: z.string().trim().min(2, "Select a country").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number"),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const deliveryMethodSchema = z.enum(["STANDARD", "EXPRESS", "NEXT_DAY"]);

export const cardSchema = z.object({
  cardName: z.string().trim().min(2, "Enter the name on the card"),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{15,16}$/, "Enter a valid card number").refine(luhn, "This card number looks incorrect")),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY")
    .refine(notExpired, "This card has expired"),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter the 3–4 digit code"),
});
export type CardInput = z.infer<typeof cardSchema>;

export const cartLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your bag is empty").max(50),
  address: addressSchema,
  saveAddress: z.boolean().default(false),
  deliveryMethod: deliveryMethodSchema,
  promoCode: z.string().trim().toUpperCase().max(30).optional(),
  /** Mock processor only: card details never reach the server, just the last 4 digits and test outcome. */
  mockPayment: mockPaymentSchema.optional(),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().min(3, "Add a short headline").max(80),
  body: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email,
  topic: z.enum(["order", "product", "returns", "press", "other"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
});

export const newsletterSchema = z.object({ email });

export const promoSchema = z.object({ code: z.string().trim().toUpperCase().min(2).max(30) });

const specSchema = z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(200) });

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2, "SKU required").max(40),
  size: z.string().trim().max(20).optional().or(z.literal("")),
  color: z.string().trim().max(30).optional().or(z.literal("")),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex colour like #1a1a1a")
    .optional()
    .or(z.literal("")),
  price: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0, "Stock can't be negative").max(100000),
});

/** Image sources next/image is configured to serve (see next.config.ts remotePatterns). */
export function isAllowedImageUrl(url: string) {
  return /^https:\/\/(images|plus)\.unsplash\.com\//.test(url) || /^\/api\/uploads\/[\w-]+\.(jpg|png|webp|avif)$/.test(url);
}

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  tagline: z.string().trim().min(2, "Tagline required").max(140),
  description: z.string().trim().min(10, "Description required").max(5000),
  price: z.number().int().min(1, "Price required"),
  compareAt: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().min(1, "Choose a category"),
  featured: z.boolean(),
  isActive: z.boolean(),
  images: z
    .array(
      z.object({
        url: z.string().trim().refine(isAllowedImageUrl, "Use an uploaded image or an images.unsplash.com URL"),
        alt: z.string().trim().max(160),
        colorKey: z.string().trim().max(30).nullable().optional(),
      }),
    )
    .min(1, "Add at least one image")
    .max(10),
  variants: z.array(variantInputSchema).min(1, "Add at least one variant").max(60),
  specs: z.array(specSchema).max(20),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const orderStatusSchema = z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]);

/** Returns a { field: message } map from a ZodError for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function luhn(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function notExpired(v: string) {
  const [mm, yy] = v.split("/").map(Number);
  const end = new Date(2000 + yy, mm, 1);
  return end > new Date();
}
