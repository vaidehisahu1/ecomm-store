# Halden — *Made for the in-between.*

A full-stack, production-quality e-commerce store for **Halden**, a fictional Copenhagen/San Francisco lifestyle brand selling clothing, footwear, leather goods, accessories, audio and home goods.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style Radix UI primitives · Framer Motion · Prisma + PostgreSQL · Auth.js v5 · Zod · Zustand · Recharts · Stripe (optional)**.

---

## Quick start (local)

Requires **Node.js 20+** and a **PostgreSQL** database: a local install, Docker, or a free hosted database such as [Neon](https://neon.tech).

```bash
# 1. Install dependencies (postinstall runs `prisma generate`)
npm install

# 2. Create your environment file and fill it in
cp .env.example .env
#    DATABASE_URL / DIRECT_URL → your Postgres connection string (the same value locally)
#    AUTH_SECRET               → openssl rand -base64 32

# 3. Create the database schema from the committed migrations
npm run db:migrate

# 4. Seed products, users, orders and reviews
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

> No Postgres handy? One option: `docker run --name halden-pg -e POSTGRES_PASSWORD=halden -p 5432:5432 -d postgres:16`, then set
> `DATABASE_URL="postgresql://postgres:halden@localhost:5432/postgres"` (and the same for `DIRECT_URL`).

### Demo accounts

| Role     | Email             | Password      |
| -------- | ----------------- | ------------- |
| Admin    | `admin@store.com` | `Admin@12345` |
| Customer | `user@store.com`  | `User@12345`  |

The admin dashboard lives at **/admin**.

### Test payments

- **Without Stripe keys (default):** checkout uses a built-in mock card processor. Use `4242 4242 4242 4242`, any future expiry (e.g. `12/30`) and any CVC. Use `4000 0000 0000 0002` to see a declined payment.
- **With Stripe test keys:** set `STRIPE_SECRET_KEY=sk_test_…` in `.env`. Checkout then redirects to Stripe's hosted payment page (test card `4242 4242 4242 4242`). Orders are confirmed on return, and optionally by webhook: run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`. If someone abandons the Stripe page, the stock held for their order is released.

### Promo codes

| Code        | Effect                          |
| ----------- | ------------------------------- |
| `WELCOME10` | 10% off                         |
| `TAKE25`    | $25 off orders over $150        |
| `HALDEN20`  | 20% off orders over $250        |
| `FREESHIP`  | Free shipping on any method     |

---

## Commands

| Command                  | What it does                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| `npm run dev`            | Start the development server on port 3000                         |
| `npm run build`          | `prisma generate` then `next build` (what Vercel runs)            |
| `npm start`              | Serve the production build                                        |
| `npm run lint`           | ESLint (Next.js core-web-vitals + TypeScript rules)               |
| `npm run typecheck`      | Strict TypeScript check                                           |
| `npm run db:migrate`     | Apply committed migrations (`prisma migrate deploy`)              |
| `npm run db:migrate:dev` | Create a new migration after editing `schema.prisma` (dev only)   |
| `npm run db:seed`        | **Wipe** store data and load the demo catalogue, users and orders |
| `npm run db:reset`       | Drop and recreate the database, then reseed (dev only)            |
| `npm run db:push`        | Sync the schema without a migration (quick prototyping)           |

## Environment variables

Every variable is documented in [`.env.example`](./.env.example). `.env` is git-ignored, so never commit real values.

| Variable                | Required          | Description                                                                 |
| ----------------------- | ----------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`          | yes               | Postgres connection used at runtime. On Neon/Vercel, use the **pooled** URL |
| `DIRECT_URL`            | yes               | Direct (non-pooled) Postgres URL, used by Prisma for migrations and seeding |
| `AUTH_SECRET`           | yes*              | Secret that signs session tokens (`openssl rand -base64 32`)                |
| `NEXTAUTH_SECRET`       | yes*              | Legacy alias for `AUTH_SECRET`. *Set at least one of the two                 |
| `NEXTAUTH_URL`          | local / custom domain | Canonical site URL. Optional on Vercel (detected automatically)          |
| `AUTH_TRUST_HOST`       | recommended       | `true` when running behind a proxy (Vercel sets this automatically)         |
| `NEXT_PUBLIC_SITE_URL`  | recommended       | Public URL for SEO, sitemap and Stripe redirects. Falls back to `NEXTAUTH_URL`, then the Vercel domain |
| `STRIPE_SECRET_KEY`     | no                | Enables real Stripe test-mode checkout. Empty means the mock processor is used |
| `STRIPE_WEBHOOK_SECRET` | no                | Verifies `/api/stripe/webhook` events                                       |

---

## Deploying to Vercel

1. **Push to GitHub.** Create an empty repository, then:
   ```bash
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. **Create a Postgres database.** The simplest route is Vercel → *Storage* → **Neon** (or create one at neon.tech). Copy two connection strings:
   - the **pooled** one (host contains `-pooler`) → `DATABASE_URL`
   - the **direct** one → `DIRECT_URL`

   If you use the Vercel Neon integration it may name the direct URL `DATABASE_URL_UNPOOLED`. Copy that value into a variable named `DIRECT_URL`.
3. **Import the repo in Vercel** (*Add New → Project*). The framework is detected as Next.js and the defaults are correct: the build command is `npm run build` (`prisma generate && next build`) and install runs `prisma generate` via `postinstall`.
4. **Add environment variables** in *Project → Settings → Environment Variables*:
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (new random value, not your local one), and optionally `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` (your production URL), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
5. **Create the tables and load demo data.** Run these once from your machine against the production database, either with its URLs in a temporary shell or `.env`, or with `vercel env pull`:
   ```bash
   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npm run db:migrate
   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npm run db:seed   # optional: demo catalogue + accounts
   ```
   ⚠️ `db:seed` deletes existing store data, so only run it on a fresh database. Do **not** run `db:reset` against production.
   For future schema changes, create migrations locally with `npm run db:migrate:dev`, commit them, then run `npm run db:migrate` against production. You can also add `prisma migrate deploy` to the build command if you want migrations applied on every deploy.
6. **Deploy.** Then sign in with `admin@store.com` / `Admin@12345` and **change the demo passwords**, or create your own admin by updating a user's `role` to `ADMIN` in the database.
7. **Optional, Stripe:** add a webhook endpoint at `https://<your-domain>/api/stripe/webhook` for the `checkout.session.completed` event, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

---

## Features

### Brand & design system
- An invented brand with a geometric SVG wordmark and a "horizon" mark, drawn as strokes so it never depends on a font.
- Warm "bone" neutrals, an ink primary and a single clay accent, all defined as CSS tokens with full **light and dark themes**. The theme follows the system preference, and the toggle cross-fades between themes.
- Typography pairs **Geist** (sans) with **Instrument Serif** (display) via `next/font`, on a fluid display scale. Spacing, radii and shadows are defined as design tokens too.
- Glass surfaces, film grain, parallax, word-by-word hero reveals, scroll-triggered entrances, page transitions, skeleton loaders, toasts and an animated add-to-bag flow. All motion respects `prefers-reduced-motion`.
- Accessibility: semantic landmarks, a skip link, visible focus rings, ARIA on custom controls, keyboard-navigable search, menus, dialogs and the gallery lightbox.

### Storefront
- **Home:** cinematic parallax hero, bento category grid, trending-products carousel, promo banner, new arrivals, editorial story, brand values, auto-rotating testimonials and a newsletter signup (saved to the DB).
- **Shop:** filters for category, price range slider, minimum rating and in-stock. Also sorting, removable filter chips, pagination and a mobile filter sheet. All filter state lives in the URL, so results are shareable and survive refresh.
- **Search:** ⌘K instant-suggestion dialog with debounced fetches, arrow-key navigation and category matches.
- **Product page:** gallery with hover zoom, thumbnails, a mobile swipe track and a fullscreen lightbox. Colour and size variants are stock-aware (sold-out options are struck through; low-stock options show an indicator), with a quantity stepper. Also: add to bag, wishlist, a sticky mobile buy bar, tabs for description, specifications and reviews (with rating distribution and a review form), related products, and JSON-LD structured data.
- **Cart:** a slide-in drawer and a full cart page, with quantity editing, item removal, a free-shipping progress meter, promo codes and estimated shipping and tax.

### Checkout & orders
- Four-step checkout: shipping address (saved or new) → delivery method → payment → review, with Zod validation at every step.
- Prices, discounts, shipping and tax are recalculated **on the server**; the client is never trusted.
- **Overselling is prevented** by a guarded atomic decrement (`UPDATE … WHERE stock >= qty`) inside a transaction. A concurrent-buyer race test confirms exactly one buyer gets the last unit.
- Confirmation page with order number, plus order tracking in the account area.

### Accounts
- Sign up (live password-strength checklist), log in, log out and a forgot-password flow (UI only; email delivery isn't implemented). Passwords are hashed with bcrypt.
- Profile and password change, an address book (add, edit, delete, set default), order history with a status tracker and order detail pages, and a wishlist.
- The cart is persisted locally for guests and **merged into the database on sign-in**, so it follows the user across devices.

### Admin (`/admin`, admin role only)
- **Overview:** revenue, orders, average order value and customer KPIs with period-over-period change; a daily revenue chart; orders by status; top products; revenue by category; recent orders; low-stock alerts.
- **Products:** search and filter; create, edit and delete products; image upload or Unsplash URLs, with reordering and alt text; a variant and inventory editor; specifications; visibility and featured toggles.
- **Orders:** status tabs with counts, search, pagination, and inline status updates. Cancelling an order returns its stock automatically.
- **Customers:** order count, review count, last order and lifetime spend.
- **Messages:** contact-form inbox with read/unread, reply-by-email and delete.

### Engineering
- Strict TypeScript with no `any`, Zod validation on every server action and route handler, and authorization checks in both middleware and each action.
- Auth.js config is split so the middleware stays lightweight; it runs on the Node.js runtime.
- SEO: per-page metadata, Open Graph tags, a dynamic `sitemap.xml`, `robots.txt` and product structured data.
- Performance: server components by default, `next/image` with responsive `sizes`, lazy-loaded imagery and optimized fonts.

---

## Project structure

```
prisma/
  schema.prisma        # User, Product, Category, Variant, Image, Review, CartItem, WishlistItem,
                       # Order, OrderItem, Address, PromoCode, ContactMessage, NewsletterSubscriber, Upload
  migrations/          # Committed SQL migrations (applied with `npm run db:migrate`)
  seed.ts              # 35 products across 6 categories, reviews, demo users, orders
src/
  actions/             # Server actions (cart, checkout, auth, account, reviews, admin, …)
  app/
    (store)/           # Storefront: home, shop, product, cart, account, content pages
    (auth)/            # Login, register, forgot password
    checkout/          # Focused checkout layout, success page
    admin/             # Admin dashboard
    api/               # Auth.js, search suggestions, Stripe webhook, uploaded images
  components/
    ui/                # Design-system primitives (Radix + Tailwind, shadcn-style)
    layout/ home/ shop/ product/ cart/ checkout/ account/ admin/ auth/ common/ brand/
  lib/                 # db, queries, pricing, validators, cart store, analytics, stripe…
  auth.ts / auth.config.ts / middleware.ts
```

## Notes
- Product photography is served from Unsplash via `next/image`.
- Admin image uploads (up to 4MB) are stored in Postgres (`Upload` table) and served by `/api/uploads/[id]`, so they work on Vercel's read-only filesystem without extra storage. For heavy media use, swap in Vercel Blob or S3.
- Search and admin filters are case-insensitive via Postgres `ILIKE` (Prisma `mode: "insensitive"`).
