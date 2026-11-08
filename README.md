# RAILROOM storefront

A clothing storefront built around a single interaction: garments hang side-on on a chrome rail, turn to face you on hover, and open into a product view on click. The layout and behaviour reproduce the reference video in `IMG_3754.MP4`. Brand name, product names and artwork are original; the reference belongs to a real label, so its name, products and photos are not reused.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components + Partial Prefetching), **React 19**, **TypeScript** (strict)
- **Postgres** via [`postgres`](https://github.com/porsager/postgres) (Neon on Vercel); JSON-file fallback for local development
- **SCSS Modules** with shared design tokens (`styles/_tokens.scss`, CSS custom properties in `app/globals.scss`)
- Payments: **LiqPay** (sandbox by default), optional Stripe, and a built-in demo mode
- No UI or state libraries. Client state uses a ~60-line `useSyncExternalStore` store with localStorage persistence.
- **Vitest** for unit tests, **Playwright** for end-to-end tests

## Features

| Area | What it does |
| --- | --- |
| Rail (`/`) | Garments flagged "on the rail" hang side-on. Hover or keyboard focus turns one to face front and shows its name and colour. Arrow, Home and End keys move along the rail. On mobile the rail scrolls sideways. |
| Homepage sections | A benefits strip, a **New in** rail in the hero's style, a **featured drop** with a colourway switcher, **category tiles** (a mini rail per category that fans out on hover) and a **newsletter** signup. |
| Catalogue (`/shop`) | Every product as a card on its own rail segment, turning to the back on hover. Category chips with live counts, size-in-stock filter, in-stock toggle, search, 5 sort orders, "Load more" (12 per page), empty state and loading skeleton. Filters live in the URL. Closing a product returns to the same filtered view. |
| Product view (`/products/[slug]`) | The garment animates from the rail into the centre (FLIP) and the rack blurs. Name, price in the selected currency, a Front/Back toggle (both sides are pre-rendered and the hanger turns, so colours never flash), size radios, Add to bag, a size/stock dialog, details and "Complete the look". Shareable URLs; back/forward work. |
| Bag & checkout | Drawer with quantity steppers capped by live stock. Checkout validates on client and server, re-prices from the database, **reserves stock in the same transaction as the order**, then hands off to the payment provider. |
| Payments | **LiqPay** Checkout (signed `data`/`signature`, sandbox unless `LIQPAY_SANDBOX=0`) with a verified server callback that marks orders paid or cancelled. Optional Stripe. Without keys, a clearly labelled **demo payment** page simulates success or failure. It collects no card data, and it's disabled automatically once a real provider is configured. Cancelled or failed payments return stock. |
| Admin panel (`/admin`) | Password login. **Products**: list with search/filter, reorder, create/edit/delete, every field including stock per size and the garment artwork (type, colours, fabric, trims, stripes, prints, colour panels) with a live front/back preview. **Orders**: list, details, status changes (cancelling returns stock). **Inbox**: contact messages and newsletter subscribers. |
| Currency | EUR / UAH / USD / GBP / NGN. Rates live in `config/site.ts`. LiqPay charges in UAH/USD/EUR (others are charged in EUR). |
| Order tracking (`/account`) | Look up an order by order number and email. |
| SEO & a11y | Per-page metadata, canonical URLs, OG image, sitemap, robots, JSON-LD. Removed or unknown products show a `noindex` "No longer on the rail" page. Semantic landmarks, native `<dialog>` modals, labelled controls, focus rings, 44px touch targets, `prefers-reduced-motion`. |

## Project structure

```
app/
  (site)/              storefront routes (shared header/footer layout)
  admin/               admin panel: login + (panel)/ products, orders, inbox
  api/                 orders, orders/lookup, contact, newsletter,
                       payments/liqpay (callback), webhooks/stripe
components/            garment SVG renderer, layout, UI primitives, SEO
features/              rack, home, shop, cart, checkout, account, search, support, currency, catalog, admin
lib/                   pure logic: catalog, cart, pricing, currency, validation, productValidation
services/
  db/                  Postgres client + schema (applied automatically)
  catalog/             product repository (Postgres | JSON) + cached getCatalog()
  orders/              orders + stock reservation
  messages/            contact messages, newsletter subscribers
  payments/            LiqPay, Stripe, provider selection
  auth/                admin session (HMAC-signed cookie)
data/products.ts       seed catalogue (loaded into an empty database)
config/site.ts         brand, currencies, shipping policy, countries
tests/unit, tests/e2e  Vitest, Playwright
```

Product artwork is generated as SVG from each product's `art` definition (`components/garment`), so adding a product in the admin panel never requires image files.

## Getting started

Requirements: Node.js 20.9+ (tested on 22.18).

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD to use /admin
npm run dev                  # http://localhost:3000
```

Without `DATABASE_URL`, data lives in `./.data/*.json`, seeded from `data/products.ts`. Delete `.data/` to reset. To develop against Postgres, set `DATABASE_URL`. Tables are created and seeded automatically on first request.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright). Build first. Set `PW_CHANNEL=msedge` or `chrome` to use an installed browser. |

## Configuration

All variables are documented in [`.env.example`](.env.example).

- **Database**: `DATABASE_URL` (Postgres). On Vercel, add **Storage → Neon (Postgres)** to the project; it injects the variable for all environments.
- **Admin**: `ADMIN_PASSWORD` (8+ characters) enables `/admin`. Sessions are 12-hour, HMAC-signed, `httpOnly` cookies, and login attempts are rate-limited. Changing the password signs everyone out.
- **LiqPay**: set `LIQPAY_PUBLIC_KEY` and `LIQPAY_PRIVATE_KEY` from your LiqPay business account. With `LIQPAY_SANDBOX=1` (the default) payments are test-only. LiqPay calls `https://<domain>/api/payments/liqpay` server-to-server, so on `localhost` the order status won't update after a sandbox payment. Use the deployed site, or mark it paid in the admin panel.
- **Stripe** (optional): `STRIPE_SECRET_KEY`, plus a webhook to `/api/webhooks/stripe` with its secret in `STRIPE_WEBHOOK_SECRET`.
- **Notifications** (optional): `*_WEBHOOK_URL` variables receive a JSON copy of each order, message and signup.

## Data & caching

- Orders reserve stock in the same database transaction (`services/orders/store.ts`). Cancelling, or a failed or reversed LiqPay payment, releases it. Orders left at "awaiting payment" keep their stock reserved until an admin cancels them.
- The storefront reads the catalogue through `getCatalog()` (`"use cache"`, tag `catalog`), so pages, including every product page, are static. Admin edits and orders call `revalidateTag("catalog", "max")`. Shoppers keep getting the cached page while a fresh one is built in the background, and changes appear within seconds. Admin pages read the database directly, so admins see their changes immediately.
- The login rate limiter (`lib/rateLimit.ts`) is in-memory per instance. Use Redis or similar if you need a global limit.

## Deployment

### Vercel (recommended)

1. Import the GitHub repository in Vercel (framework preset: Next.js).
2. **Storage → Create → Neon (Postgres)** and connect it to the project (all environments).
3. **Settings → Environment Variables**: add `ADMIN_PASSWORD`, and optionally `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY` (and `LIQPAY_SANDBOX=0` for live payments).
4. Redeploy. The first request creates the tables and seeds the catalogue.

### Node server / Docker

```bash
npm ci && npm run build
DATABASE_URL=postgres://… ADMIN_PASSWORD=… NEXT_PUBLIC_SITE_URL=https://shop.example.com npm start -- -p 3000
```

Set `NEXT_PUBLIC_*` variables at **build** time; they're inlined into the client bundle.

## Testing

- `npm test`: 27 unit tests covering cart, pricing, currency, catalogue search and filters, customer and product validation, LiqPay signing and callback verification, Stripe signatures, and admin session tokens.
- `npm run test:e2e`: 17 flows on desktop and mobile. Storefront, bag, checkout through demo payment to tracking, search, catalogue, contact, newsletter, mobile menu, and admin (login, create/edit/delete a product and see it in the store, validation, cancelling an order returns stock). Tests use `.data/e2e` and a test-only admin password set in `playwright.config.ts`.
