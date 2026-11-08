# RAILROOM storefront

A clothing storefront built around a single interaction: garments hang side-on on a chrome rail, turn to face you on hover, and open into a product view on click. The layout and behaviour reproduce the reference video in `IMG_3754.MP4`. Brand name, product names and artwork are original; the reference belongs to a real label, so its name, products and photos are not reused.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components + Partial Prefetching), **React 19**, **TypeScript** (strict)
- **SCSS Modules** with shared design tokens (`styles/_tokens.scss`, CSS custom properties in `app/globals.scss`)
- No UI or state libraries. Client state uses a ~60-line `useSyncExternalStore` store with localStorage persistence.
- **Vitest** for unit tests, **Playwright** for end-to-end tests

## Features

| Area | What it does |
| --- | --- |
| Rail (`/`) | 9 garments on a rail. Hover or keyboard focus turns a garment to face front and shows its name and colour. Arrow, Home and End keys move along the rail. On mobile the rail scrolls sideways. |
| Homepage sections | Below the hero: a benefits strip (shipping, returns, small runs, secure checkout); a **New in** rail in the same style as the hero (opens pieces in the hero panel); a **featured drop** with a colourway switcher, a swaying garment that turns to its back on hover, and a CTA; **category tiles** (a mini rail per category whose garments turn and fan out on hover); and a **newsletter** signup. |
| Catalogue (`/shop`) | All 28 pieces as cards hanging from their own rail segment, turning to the back on hover. Category chips with live counts, size-in-stock filter, in-stock toggle, search, 5 sort orders, "Load more" pagination (12 per page), empty state and loading skeleton. Filters live in the URL, so views are shareable. Opening a product and closing it returns to the same filtered view. |
| Product range | 28 products across shirts, outerwear, hoodies, tops and bottoms. Trousers and shorts are drawn on clip hangers (button or drawcord waist, cargo pockets, side stripes). The panel adds a "Complete the look" row and waist/inseam measurements for bottoms. |
| Product view (`/products/[slug]`) | Clicking animates the garment from the rail into the centre (FLIP) and blurs the rack. Shows name, price in the selected currency, a Front/Back toggle with a flip animation, size radios (sold-out sizes disabled, low stock flagged), Add to bag, a "See availability" dialog with stock and measurements, and a details accordion. URLs are shareable, and back/forward work because selection uses the history API and is read back through `usePathname`. |
| Bag | Slide-in drawer with quantity steppers (capped by stock and a per-line max), remove, free-shipping progress and totals. Persisted in localStorage and synced across tabs. |
| Currency | EUR / USD / GBP / NGN selector. Rates live in `config/site.ts`; the choice is persisted. |
| Search | Text search, category filter, sorting and an empty state. Choosing a result opens it on the rail. |
| Checkout (`/checkout`) | Contact and shipping form with client and server validation (shared validators). The server re-prices the cart from the catalogue, checks stock, stores the order, and redirects to Stripe Checkout when configured. |
| Order tracking (`/account`) | Look up an order by order number and email. |
| Support | Floating chat button opens a contact form (honeypot, rate limit) that posts to a webhook or a local inbox. |
| Content | About, Shipping & Returns, a custom 404 and an error boundary. |
| SEO | Per-page metadata, canonical URLs, Open Graph image (`app/opengraph-image.tsx`), `sitemap.xml`, `robots.txt`, JSON-LD (Organization, ItemList, Product), real 404s for unknown products (`proxy.ts`). |
| Accessibility | Semantic landmarks, skip link, native `<dialog>` modals (focus trap and Escape), labelled controls, `aria-live` updates, visible focus rings, 44px touch targets on mobile, `prefers-reduced-motion` respected. |

## Project structure

```
app/                 routes, layouts, metadata files, API route handlers
  api/orders         POST create order (+ /lookup)
  api/contact        POST contact message
  api/newsletter     POST newsletter signup
  api/webhooks/stripe  Stripe webhook (signature-verified)
components/          reusable UI: garment SVG renderer, layout, ui primitives, seo
features/            feature modules: rack, home (sections), shop (catalogue), cart, checkout, account, search, support, currency
lib/                 pure logic: catalog, cart, pricing, currency, validation, store, rate limit
services/            server-only integrations: order store, Stripe, notifications
data/products.ts     product catalogue (prices, stock, artwork definition)
config/site.ts       brand, currencies, shipping policy, countries
styles/_tokens.scss  breakpoints, mixins, motion
tests/unit           Vitest
tests/e2e            Playwright
```

Product artwork is generated as SVG from each product's `art` definition (`components/garment`). Garment type, colours, fabric pattern (solid, plaid, stripe, rib), colour-blocked panels and back prints are all data, so adding a product never requires image files. To use photography instead, replace `GarmentArt` with `next/image` and add an `image` field to `Product`.

## Getting started

Requirements: Node.js 20.9+ (tested on 22.18).

```bash
npm install
cp .env.example .env.local   # optional: everything works without it
npm run dev                  # http://localhost:3000
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Build first. Set `PW_CHANNEL=msedge` or `chrome` to use an installed browser, or run `npx playwright install chromium` once. |

## Configuration

All variables are documented in [`.env.example`](.env.example).

- **Payments**: set `STRIPE_SECRET_KEY` to enable Stripe Checkout. Then add a webhook endpoint in the Stripe dashboard pointing to `https://<your-domain>/api/webhooks/stripe` with the `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired` events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. Paid orders move from `pending_payment` to `paid`. For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- **Notifications**: set `CONTACT_WEBHOOK_URL` / `ORDER_WEBHOOK_URL` / `NEWSLETTER_WEBHOOK_URL` to receive JSON events. Without them, events are appended to `DATA_DIR/*-inbox.jsonl`.
- **Catalogue**: edit `data/products.ts` (prices in euro cents, stock per size; `rail: true` puts a piece on the hero rail, `isNew: true` adds it to New in). Exchange rates and the shipping policy are in `config/site.ts`.
- **Brand**: `NEXT_PUBLIC_BRAND_NAME`, plus the copy in `config/site.ts` and `app/about/page.tsx`.

## Data & persistence

Orders are stored by `services/orders/store.ts` in `DATA_DIR/orders.json`, with serialised, atomic writes (temp file + rename). This suits a single long-running Node.js server with a persistent disk (a VPS, Docker with a volume, Render or Railway with a disk).

For serverless or multi-instance hosting (e.g. Vercel), replace that module with a database-backed version (Postgres, SQLite/Turso, DynamoDB…) that keeps the same four exported functions (`createOrder`, `findOrder`, `updateOrder`, `setOrderStatus`). Nothing else changes. The rate limiter in `lib/rateLimit.ts` is in-memory and per-instance; use a shared store such as Redis when you scale out.

Stock levels come from the catalogue. Orders are validated against them but don't decrement them. Connect the store to an inventory source if you need live stock.

## Deployment

### Node server / Docker

```bash
npm ci
npm run build
DATA_DIR=/var/lib/railroom NEXT_PUBLIC_SITE_URL=https://shop.example.com npm start -- -p 3000
```

Put it behind a reverse proxy (nginx or Caddy) with TLS, and make sure `DATA_DIR` is on a persistent volume. Set `NEXT_PUBLIC_*` variables at **build** time, because they're inlined into the client bundle.

### Vercel

Works as-is for browsing, bag, search and SEO. Swap the order store for a database first (see above), because the serverless filesystem isn't persistent. Then set the environment variables in the project settings.

## Testing

- `npm test`: 19 unit tests covering cart rules, pricing and shipping, currency conversion, catalogue search, filters and sorting, rail and related-product consistency, validation, and Stripe signature verification.
- `npm run test:e2e`: 14 flows on desktop (1440×900) and mobile (Pixel 7). Covers the rail, the product panel and bag, sold-out handling, search, checkout through to tracking, the contact form, the 404 page, the homepage sections, catalogue filters and pagination, returning from a product, the newsletter and the mobile menu. Tests write to `.data/e2e`.
