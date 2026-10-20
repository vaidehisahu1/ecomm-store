# Halden — *Made for the in-between.*

A full-stack e-commerce store for **Halden**, a fictional Copenhagen/San Francisco lifestyle brand selling clothing, footwear, leather goods, accessories, audio and home goods.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Radix UI primitives (shadcn-style) · Framer Motion · Prisma + PostgreSQL · Auth.js v5 · Zod · Zustand · Recharts · Stripe (optional) · Resend (optional) · Upstash (optional)**.

---

## Quick start (local)

Requires **Node.js 20+** and a **PostgreSQL** database: a local install, Docker, or a free hosted database such as [Neon](https://neon.tech).

```bash
# 1. Install dependencies (postinstall runs `prisma generate`)
npm install

# 2. Create your environment file and fill it in
cp .env.example .env
#    DATABASE_URL / DIRECT_URL                → your local Postgres (the same value for both)
#    AUTH_SECRET                              → openssl rand -base64 32
#    SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD → passwords for the seeded accounts

# 3. Create the database schema from the committed migrations
npm run db:migrate

# 4. Seed products, users, orders and reviews (local databases only, see "Seeding")
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000** and sign in with the `SEED_ADMIN_EMAIL` (default `admin@example.com`) / `SEED_ADMIN_PASSWORD` you chose.

> No Postgres handy? One option: `docker run --name halden-pg -e POSTGRES_PASSWORD=halden -p 5432:5432 -d postgres:16`, then set
> `DATABASE_URL="postgresql://postgres:halden@localhost:5432/postgres"` (and the same for `DIRECT_URL`).

### Seeding

`npm run db:seed` **deletes all store data** and loads the demo catalogue. It refuses to run when:
- `NODE_ENV=production`, or
- `DATABASE_URL`'s host isn't `localhost` / `127.0.0.1`, unless `ALLOW_DESTRUCTIVE_SEED=true`, or
- `SEED_ADMIN_PASSWORD` / `SEED_USER_PASSWORD` are missing or too weak.

To change a password on any database without reseeding: `npm run admin:set-password -- <email> <new-password>`.

### Test payments

- **Mock processor** (no Stripe keys): available in development. In production it is **disabled** unless `ALLOW_MOCK_PAYMENTS=true` (for demo deployments), in which case checkout shows "payments unavailable" instead. Use `4242 4242 4242 4242`, any future expiry and any CVC; `4000 0000 0000 0002` simulates a decline. Card details are checked in the browser and never sent to the server: only the last four digits and the test outcome are.
- **Stripe test mode:** set `STRIPE_SECRET_KEY=sk_test_…`. Checkout redirects to Stripe's hosted page. Orders are confirmed on return and by webhook (`stripe listen --forward-to localhost:3000/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`). Sessions expire after 30 minutes.

### Email

With `RESEND_API_KEY` and `EMAIL_FROM` set, password-reset links and order confirmations are sent through [Resend](https://resend.com). Without them, emails are printed to the server console in development. In production nothing is sent, and the forgot-password form says email reset is unavailable instead of claiming an email was sent.

### Promo codes (seeded)

| Code        | Effect                          |
| ----------- | ------------------------------- |
| `WELCOME10` | 10% off                         |
| `TAKE25`    | $25 off orders over $150        |
| `HALDEN20`  | 20% off orders over $250        |
| `FREESHIP`  | Free shipping on any method     |

---

## Commands

| Command                      | What it does                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                | Start the development server on port 3000                                      |
| `npm run build`              | `prisma generate` then `next build` (what Vercel runs)                         |
| `npm start`                  | Serve the production build                                                     |
| `npm run lint`               | ESLint (Next.js core-web-vitals + TypeScript rules, `no-explicit-any` as error) |
| `npm run typecheck`          | Strict TypeScript check                                                        |
| `npm test`                   | Unit tests (Vitest, no database needed)                                        |
| `npm run test:integration`   | Postgres integration tests (skipped unless `DATABASE_URL_TEST` is set)         |
| `npm run db:migrate`         | Apply committed migrations (`prisma migrate deploy`)                           |
| `npm run db:migrate:dev`     | Create a new migration after editing `schema.prisma` (local only)              |
| `npm run db:seed`            | **Wipe** store data and load the demo catalogue (local only, see "Seeding")    |
| `npm run db:reset`           | Drop and recreate the database, then reseed (local only)                       |
| `npm run admin:set-password` | `-- <email> <password>`: set a user's password without reseeding               |

## Tests

```bash
npm test                 # unit tests
npm run test:integration # Postgres integration tests
```

The integration suite runs real concurrent checkouts against Postgres: two buyers for the last unit, and eight buyers for three units. Point it at a **separate, disposable** database:

```bash
createdb halden_test   # or any empty Postgres database
DATABASE_URL=postgresql://localhost:5432/halden_test npx prisma migrate deploy
DATABASE_URL_TEST=postgresql://localhost:5432/halden_test npm run test:integration
```

It creates and deletes only its own rows, and refuses non-localhost URLs unless `ALLOW_REMOTE_TEST_DB=true`.

### What the tests cover

| Behaviour                                                                                   | Test                                    |
| ------------------------------------------------------------------------------------------- | --------------------------------------- |
| Concurrent buyers can't oversell (real Postgres)                                            | `tests/integration/stock-guard.test.ts` |
| Server-side pricing, promo rules, stock guard, rollback on stock failure                    | `tests/checkout.test.ts`                |
| Shipping, discounts, free-shipping threshold, tax rounding                                  | `tests/pricing.test.ts`                 |
| Password rules, card Luhn/expiry, address and checkout schemas                              | `tests/validators.test.ts`              |
| Order status transitions; optimistic status updates; single restock; order-number retry     | `tests/order-transitions.test.ts`, `tests/order-concurrency.test.ts` |
| Revenue counts only PAID/SHIPPED/DELIVERED; pending shown separately                        | `tests/analytics.test.ts`               |
| "Verified buyer" only for paid orders containing the product                                | `tests/reviews.test.ts`                 |
| Reset tokens: hashed, 30-minute expiry, single use, older tokens retired                    | `tests/password-reset.test.ts`          |
| Email transport (Resend, dev console, production silence) and HTML escaping                 | `tests/email.test.ts`                   |
| Stripe: session expiry before cancel, cancelled-then-paid refunds, webhook idempotency      | `tests/stripe-checkout.test.ts`, `tests/stripe-webhook.test.ts` |
| Mock checkout never sends the card number                                                   | `tests/mock-card.test.ts`               |
| Upload type detection from file bytes                                                       | `tests/image-sniff.test.ts`             |
| Rate limiting (memory and Upstash backends, fail-open) and where each limiter is applied    | `tests/rate-limit.test.ts`, `tests/rate-limit-wiring.test.ts` |
| Equal login timing for unknown emails; role refresh every 10 minutes                        | `tests/auth-hardening.test.ts`          |
| Upload responses: byte-detected type, `nosniff`, `default-src 'none'`                       | `tests/uploads-route.test.ts`           |
| Seed refuses production and remote databases                                                | `tests/seed-guard.test.ts`              |

## Environment variables

Every variable is documented in [`.env.example`](./.env.example). `.env` is git-ignored, so never commit real values.

| Variable                   | Required                | Description                                                                          |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`             | yes                     | Postgres connection used at runtime. On Neon/Vercel use the **pooled** URL           |
| `DIRECT_URL`               | yes                     | Direct (non-pooled) URL, used by Prisma for migrations                               |
| `AUTH_SECRET`              | yes*                    | Signs session tokens (`openssl rand -base64 32`)                                     |
| `NEXTAUTH_SECRET`          | yes*                    | Legacy alias for `AUTH_SECRET`. *Set at least one                                    |
| `NEXTAUTH_URL`             | local / custom domain   | Canonical site URL. Optional on Vercel (detected automatically)                      |
| `AUTH_TRUST_HOST`          | recommended             | `true` behind a proxy (Vercel sets this automatically)                               |
| `NEXT_PUBLIC_SITE_URL`     | recommended             | Public URL for SEO, emails and Stripe redirects                                      |
| `STRIPE_SECRET_KEY`        | for real payments       | Enables Stripe Checkout                                                              |
| `STRIPE_WEBHOOK_SECRET`    | with Stripe             | Verifies `/api/stripe/webhook`                                                       |
| `ALLOW_MOCK_PAYMENTS`      | demo deploys only       | `true` enables the mock processor in production when Stripe isn't configured         |
| `CRON_SECRET`              | yes on Vercel           | Bearer token for `/api/cron/expire-orders` (Vercel Cron sends it automatically)      |
| `RESEND_API_KEY`           | for email               | Resend API key                                                                       |
| `EMAIL_FROM`               | for email               | Sender on a Resend-verified domain, e.g. `Halden <orders@yourdomain.com>`            |
| `UPSTASH_REDIS_REST_URL`   | recommended in prod     | Shared rate limiting across serverless instances                                     |
| `UPSTASH_REDIS_REST_TOKEN` | recommended in prod     | Token for the above                                                                  |
| `SEED_ADMIN_PASSWORD`      | for `db:seed` only      | Password for the seeded admin. Local `.env` only, never in Vercel                    |
| `SEED_USER_PASSWORD`       | for `db:seed` only      | Password for the seeded customer. Local `.env` only                                  |
| `SEED_ADMIN_EMAIL`         | optional                | Seeded admin email (default `admin@example.com`)                                     |
| `SEED_USER_EMAIL`          | optional                | Seeded customer email (default `customer@example.com`)                               |
| `ALLOW_DESTRUCTIVE_SEED`   | avoid                   | `true` lets the seed wipe a non-localhost database                                   |
| `DATABASE_URL_TEST`        | for integration tests   | Disposable database for `npm run test:integration`. Local only                       |

---

## Deploying to Vercel

1. **Push to GitHub** and **import the repo in Vercel** (*Add New → Project*). The defaults are correct: the build runs `npm run build` (`prisma generate && next build`) and install runs `prisma generate` via `postinstall`.
2. **Create a Postgres database:** Vercel → *Storage* → **Neon**, or neon.tech. Use the **pooled** connection string (host contains `-pooler`) as `DATABASE_URL` and the **direct** one as `DIRECT_URL`. The Vercel Neon integration may call the direct URL `DATABASE_URL_UNPOOLED`; copy it into `DIRECT_URL`.
3. **Add environment variables** in *Project → Settings → Environment Variables*:
   - Always: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (a new random value), `CRON_SECRET` (`openssl rand -hex 32`).
   - Payments: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, **or** `ALLOW_MOCK_PAYMENTS=true` for a demo. Without either, checkout is disabled in production.
   - Email: `RESEND_API_KEY` + `EMAIL_FROM`. Without them, password reset by email is unavailable and no confirmations are sent.
   - Rate limiting: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Vercel → Storage → Upstash).
   - Optional: `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` for a custom domain.
   - Never in Vercel: `SEED_*`, `ALLOW_DESTRUCTIVE_SEED`, `DATABASE_URL_TEST`.
4. **Apply migrations** from your machine before each deploy that adds one:
   ```bash
   DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npx prisma migrate deploy
   ```
5. **First deploy only, optional demo data:** the seed refuses remote databases by default. On a **fresh, empty** database you can run
   `ALLOW_DESTRUCTIVE_SEED=true DATABASE_URL=… DIRECT_URL=… SEED_ADMIN_PASSWORD=… SEED_USER_PASSWORD=… npm run db:seed`. Never do this on a database with real data.
6. **Cron:** `vercel.json` schedules `/api/cron/expire-orders` **daily at 03:00 UTC** (Vercel Hobby allows one run per day). It cancels and restocks Stripe orders still `PENDING` after 60 minutes, after first expiring their Checkout Session and skipping any that were actually paid. On a Pro plan you can make it hourly (`0 * * * *`).
7. **Stripe webhook:** add an endpoint at `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed` and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

### Before going live

- [ ] Rotate every seeded or previously shared password: `npm run admin:set-password -- <email> <new-password>` (against the production `.env`).
- [ ] `ALLOW_MOCK_PAYMENTS` is **unset**, and real Stripe keys plus `STRIPE_WEBHOOK_SECRET` are configured.
- [ ] `CRON_SECRET` is set in Vercel (otherwise the cron endpoint returns 401 and abandoned orders keep their stock).
- [ ] `RESEND_API_KEY` and `EMAIL_FROM` are set, and the sender domain is verified in Resend.
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set, so rate limits are shared across instances.
- [ ] `npx prisma migrate deploy` has been run against production for the version you're deploying.
- [ ] The seeded demo catalogue, reviews and orders are removed or replaced if this is a real shop.
- [ ] The policy copy in `src/lib/site.ts` (returns, repairs, warranty) and the legal pages match what you actually offer.
- [ ] The GitHub repository visibility is what you intend.

---

## Features

### Storefront
- **Home:** hero, category grid, trending carousel, promo banner, new arrivals, editorial and brand-values sections, newsletter signup (saved to the database).
- **Shop:** category, price range, minimum rating and in-stock filters, sorting, filter chips and pagination, all kept in the URL; ⌘K instant search with suggestions.
- **Product page:** image gallery with zoom and lightbox; colour/size variants with stock awareness (each image is tagged with the colour it shows); quantity; wishlist; description/specifications/reviews tabs with review submission; related products; JSON-LD.
- **Cart:** slide-in drawer and full page, quantity edit, promo codes, free-shipping meter, shipping and tax estimates.
- Light and dark themes, responsive layout.

### Checkout & orders
- Four steps: address → delivery → payment → review.
- Prices, discounts, shipping and tax are recomputed on the server, and stock is reserved with an atomic guarded decrement inside the order transaction (see tests).
- Order numbers are random and retried on collision. Status changes follow PENDING → PAID/CANCELLED, PAID → SHIPPED/CANCELLED, SHIPPED → DELIVERED, and are applied only if the order hasn't changed in the meantime.
- Stripe: unpaid sessions are expired before an order is cancelled. A payment that arrives for an already-cancelled order is refunded automatically, or flagged for manual refund on the admin order page.
- The success page says "Order confirmed" only once payment is recorded; otherwise "Payment processing".

### Accounts
- Sign up, log in, log out; email password reset with single-use, hashed, 30-minute links.
- Profile and password change, address book, order history with tracking, wishlist.
- Guest cart in local storage, merged into the saved cart on sign-in.

### Admin (`/admin`, admin role only)
- **Overview:** revenue, paid orders, average order value and customers (paid orders only, with "awaiting payment" shown separately); daily revenue, top products and categories; recent orders; low stock.
- **Products:** create/edit/delete, image upload (JPEG/PNG/WebP/AVIF detected from file bytes, max 4 MB) or Unsplash URLs, per-image colour tag, variants and stock, specifications.
- **Orders:** filters, search, status updates limited to valid transitions; refund records for late Stripe payments.
- **Customers:** paid orders, lifetime spend, pending value.
- **Messages:** contact-form inbox.

### Security notes
- Passwords are hashed with bcrypt (cost 12). Logins for unknown emails take as long as wrong passwords, and session roles are re-read from the database every 10 minutes.
- Rate limits cover login (including the raw Auth.js endpoint), registration, password reset, contact, newsletter, promo codes and search.
- Uploaded files are served with `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'`.

---

## Changelog

### Hardening pass 2 (October 2026)

**New environment variables:** `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD`, `SEED_ADMIN_EMAIL`, `SEED_USER_EMAIL`, `ALLOW_DESTRUCTIVE_SEED`, `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DATABASE_URL_TEST`, `ALLOW_REMOTE_TEST_DB`.

**New migrations:** `20261020100000_password_reset_tokens`, `20261020110000_stripe_events`, `20261020120000_image_color_key` (the last one backfills existing seed images).

- Public demo credentials removed. Seeded passwords now come from the environment, and `npm run admin:set-password` rotates passwords in place.
- The seed refuses production and non-local databases.
- Revenue, analytics and customer spend count only paid orders.
- Content honesty: "Verified buyer" only for real purchasers; the success page reflects the payment status; invented testimonials removed; product perks generated from one policy config.
- Email password reset and order confirmation emails (Resend).
- Stripe: sessions are expired on cancel, refunds issued for payments after cancellation, and the webhook is idempotent.
- Race-safe status updates, restocks and order numbers.
- Upload type detection from bytes, plus security headers on served files.
- Upstash-backed rate limiting.
- Explicit image colour keys; mock checkout never sends card numbers.
- Postgres integration test for the stock guard.

### Quality & security pass (October 2026)

**New environment variables:** `ALLOW_MOCK_PAYMENTS`, `CRON_SECRET`.

- Admin image uploads were 404ing in deployments because `.gitignore` excluded the uploads route; fixed.
- `PaymentProvider` abstraction (mock / Stripe) with a production guard on the mock provider.
- `placeOrder` split into tested steps in `src/lib/checkout/`.
- Order status transition rules.
- Scheduled cleanup of abandoned Stripe orders (daily on Vercel Hobby); Stripe sessions expire after 30 minutes.
- Rate limiting (in-memory).
- `Product.specs` stored as native `Json`.
- Login timing equalised; roles refreshed from the database.
- Review submission no longer hangs in production builds.
- Vitest unit suite.

## Project structure

```
prisma/
  schema.prisma        # Users, catalogue, carts, orders, reviews, promos, messages, uploads,
                       # PasswordResetToken, StripeEvent
  migrations/          # Committed SQL migrations (`npx prisma migrate deploy`)
  seed.ts, seed-guard.ts
scripts/
  set-admin-password.ts
src/
  actions/             # Server actions (cart, checkout, auth, account, reviews, admin, …)
  app/
    (store)/           # Storefront and account pages
    (auth)/            # Login, register, forgot / reset password
    checkout/          # Checkout and success page
    admin/             # Admin dashboard
    api/               # Auth.js, search, Stripe webhook, uploads, cron
  components/          # UI primitives and feature components
  lib/                 # checkout/, payments/, pricing, validators, email, rate-limit, orders, …
tests/                 # Vitest unit tests; integration/ needs DATABASE_URL_TEST
```

## Notes
- Product photography is served from Unsplash via `next/image`.
- Admin uploads are stored in Postgres (`Upload` table), so they work on Vercel's read-only filesystem. For heavy media, swap in Vercel Blob or S3.
