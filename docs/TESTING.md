# Testing

| Command                    | What it runs                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| `npm run typecheck`        | `next typegen` + `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint`             | ESLint (Next.js rules, React Compiler rules, no `any`)               |
| `npm run format:check`     | Prettier with Tailwind class ordering                                |
| `npm run test:unit`        | Vitest, pure modules (no database)                                   |
| `npm run test:integration` | Vitest against a disposable local MongoDB database                   |
| `npm test`                 | Both Vitest projects                                                 |
| `npm run test:e2e`         | Playwright against a production build with its own seeded database   |

All of these require only local services; none touch production.

## Unit tests (`tests/unit`)

They cover:

- search parameter parsing, serialisation and SEO indexability rules
- the MongoDB filter and sort builder, including operator-injection attempts
- price formatting (BDT lakh/crore), mortgage maths and similar-listing ranking
- the role and permission matrix, ownership rules and safe redirects
- video and tour embed allow-listing
- Markdown sanitising (scripts, event handlers, `javascript:` links)
- image variant selection and the `next/image` loader
- the inquiry and admin Zod schemas (consent, honeypot, dates, price, media allow-list, slugs)
- the `replaceFields` update builder

## Integration tests (`tests/integration`)

These run against `mongodb://localhost:27017/tanvirdev_property_test` (override with
`TEST_MONGODB_URI`). The setup refuses any database that is not local or whose name does not end
in `_test`, then drops it at the start of the run.

Only Next.js request APIs are replaced:

- `next/headers`
- `next/cache` tag functions
- `after()`
- the session lookup, so a test can act as a given user

Server actions, services, models, Better Auth configuration and MongoDB are the real ones.

They cover:

- **Better Auth configuration:**
  - sign-up hashing and default role; sign-up can't choose a staff role
  - minimum password length; correct and incorrect sign-in
  - legacy bcrypt hashes; disabled accounts
- **Listing management:**
  - unique slugs and denormalised location names
  - clearing optional fields
  - location and advisor validation
  - advisor ownership; admin-only placement and deletion
  - cascade of favourites
  - the server action's authentication, permission and validation
- **Client features:**
  - idempotent favourites; unpublished and malformed ids
  - canonical, de-duplicated saved searches that can't be deleted by another user
  - enquiries linked to listing, advisor and client, with hashed IP, de-duplication and per-IP
    rate limiting
- **Search:**
  - published-only results and every filter
  - price-on-request visibility
  - deterministic sorting and pagination
  - text search with partial-word fallback
  - no private address or exact coordinates in result cards

## End-to-end tests (`tests/e2e`)

`playwright.config.ts` starts the app as it runs in production. Every run:

1. `tests/e2e/prepare-database.ts` seeds the demonstration catalogue into
   `tanvirdev_property_e2e` (local only; the name must end in `_e2e`) and syncs indexes.
2. The app is built with `next build` and started with `next start` on port 3100, with
   throwaway secrets from `tests/e2e/environment.ts`.
3. `tests/e2e/global-setup.ts` resets per-run data and creates a test admin and test client
   through the real sign-up endpoint. Their sessions are saved under `tests/e2e/.auth/`
   (git-ignored).

When a server is already listening on port 3100 locally, Playwright reuses it, so rebuild after
changing app code.

The 23 journeys (desktop Chrome, plus a Pixel 7 profile for mobile) cover:

- homepage, search filters and canonical/noindex rules
- the property page: gallery, mortgage calculator, JSON-LD
- real 404 status codes for unknown listings, guides, advisors and articles
- comparison; location, advisor and insight pages
- robots.txt and the sitemap; security headers
- sign-up and sign-out; failed sign-in; sign-in redirects
- favourites, saved searches and viewing requests for a signed-in client
- the admin: access control for anonymous visitors and clients; dashboard and every management
  area; creating, publishing and deleting a listing with a real image upload; updating an
  enquiry's status
- the mobile menu, no horizontal overflow, mobile accessibility

Pages are checked with axe-core against WCAG 2.0–2.2 A/AA rules. The run fails on any serious or
critical violation, measured after entrance animations finish.

## Results at the time of writing

Local results, not taken from CI:

- typecheck, lint and format check: clean
- `npm test`: 84 passed (unit and integration)
- `npm run test:e2e`: 23 passed, twice in a row

Lighthouse 13.5, mobile preset (simulated throttling), local production build, demonstration
data:

| Page                               | Performance | Accessibility | Best practices | SEO |
| ---------------------------------- | ----------- | ------------- | -------------- | --- |
| `/`                                | 62          | 100           | 100            | 100 |
| `/properties`                      | 60          | 100           | 100            | 91  |
| `/properties/banani-garden-duplex` | 56          | 100           | 100            | 100 |

- **Performance** is limited by main-thread time during hydration (LCP 4.8–6.2 s and Total
  Blocking Time 0.7–1.6 s under 4× CPU throttling, varying between runs). Initial JavaScript is
  about 320–360 KB compressed, most of it React, the Next.js runtime and Base UI. Unthrottled, the
  LCP images load within about 50–170 ms of being requested.
- **SEO on `/properties` (91):** Lighthouse is served Next.js's streamed metadata, so the
  description arrives after `</head>`. Crawlers that don't execute JavaScript (Bing, social
  previews) get it in `<head>`. See [SEO.md](SEO.md).

These are lab numbers on a developer machine. Field data (Vercel Speed Insights) is only
available once the site is deployed.
