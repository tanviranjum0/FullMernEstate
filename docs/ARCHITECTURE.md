# Architecture

TanvirDev Property is a single Next.js 16 application (App Router, React 19, TypeScript) backed
by MongoDB. It replaces the legacy Express + React SPA described in
[LEGACY-AUDIT.md](LEGACY-AUDIT.md); none of the legacy runtime code is reused.

```
Browser ──► Next.js (Vercel Functions, Node.js)
              ├─ Server Components  ──► src/server/queries  ('use cache' + cacheTag)
              ├─ Server Actions     ──► src/server/actions  ──► src/server/services
              ├─ Route Handlers     ──► auth, media upload, analytics events, previews
              └─ Proxy (src/proxy.ts): optimistic redirect for /account and /admin
                        │
                        ▼
              One MongoClient per instance
              ├─ Better Auth (native driver): user, account, session, verification, rateLimit
              └─ Mongoose models: properties, agents, locations, articles, inquiries, …
Media ──► Vercel Blob (production) or .data/media served by /media/[...path] (development)
```

## Rendering and caching

- **Cache Components** (`cacheComponents: true`). Public catalogue reads live in
  `src/server/queries/*`, are marked `'use cache'`, and are tagged via `src/server/cache-tags.ts`
  (`properties`, `property:<slug>`, `locations`, `articles`, `settings`, …). Most use
  `cacheLife("hours")`; volatile summaries use `"minutes"`.
- **Invalidation.** Every admin mutation calls `updateTag(...)` for the affected tags inside the
  server action, so public pages reflect changes on the next request.
- **Static generation.** Detail routes (`/properties/[slug]`, `/locations/...`, `/agents/[slug]`,
  `/insights/...`) export `generateStaticParams` and are prerendered at build time.
- **Status codes.** `partialPrefetching` is deliberately **off**. With it on, a slug that was not
  prerendered is answered with the route's App Shell (HTTP 200) before the page can call
  `notFound()`. With it off, unlisted slugs render blocking, like `fallback: 'blocking'`. Detail
  pages resolve their record before anything streams (`export const instant = false`), so unknown
  or unpublished slugs return a real **404**, and a newly published listing's first request
  returns complete HTML.
- **Per-user data never enters the cache.** The session is read in the root layout inside
  `<Suspense>` (`FavoritesLoader`) and streamed into a client store. The account area and admin
  render per request.

## Data flow and boundaries

- `src/server/models`: Mongoose schemas. They are never imported by components.
- `src/server/mappers.ts`: converts documents to plain DTOs (`src/server/dto.ts`). Public DTOs
  never contain private fields (the full address, internal notes). Coordinates are snapped to
  0.01° (~1 km) unless the listing opts into showing its exact location.
- `src/server/queries`: read side (cached public reads, per-request admin reads).
- `src/server/services`: write side and business rules (slug allocation, permissions,
  ownership, audit log, media clean-up, deduplicated enquiries).
- `src/server/actions`: `'use server'` entry points. Each one authenticates
  (`src/lib/auth/session.ts`), authorises (`src/lib/auth/permissions.ts`), validates with Zod
  (`src/lib/validation/*`), rate-limits where abuse is plausible, then calls a service.
- Admin updates use `replaceFields()` (`src/server/services/admin/shared.ts`). It sets defined
  fields and unsets top-level `undefined` ones, so clearing an optional field really clears it,
  and `$set`/`$unset` never target overlapping paths.

## Authentication and authorisation

- **Better Auth 1.7** with the MongoDB adapter, sharing the app's `MongoClient` (transactions
  enabled).
  - Email and password, minimum 10 characters, scrypt hashing.
  - Migrated legacy accounts keep bcrypt hashes, which are verified with `bcryptjs`.
- **Sessions** are database sessions in HTTP-only cookies (prefixed `tdp`, `__Secure-` in
  production). `getCurrentUser()` checks the session against the database, bypassing Better
  Auth's signed cookie cache, so sign-out and revoked sessions take effect immediately.
- **Roles** are re-read from the database on every request:
  - `user` (client)
  - `agent` (advisor: own listings and enquiries)
  - `editor` (content and locations)
  - `admin` (everything)

  The permission matrix lives in `src/lib/auth/permissions.ts`. Disabling an account revokes its
  sessions and blocks sign-in (Better Auth `session.create.before` hook).

- `src/proxy.ts` only does an optimistic cookie-presence redirect for `/account` and `/admin`.
  The real checks happen server-side in layouts, pages, actions and route handlers.

## Media

- Uploads go to `POST /api/admin/media`, which applies:
  - same-origin check
  - `media:upload` permission
  - rate limit
  - 4 MB cap (the browser downscales larger photos first)
- `sharp` decodes the image (rejecting anything that isn't a real image), auto-orients it, strips
  metadata and writes WebP variants `w320 … w2560`, plus a 16 px blur placeholder. Variants are
  stored under `{kind}/{uuid}/`.
- `src/lib/media/image-loader.ts` (the custom `next/image` loader) maps requested widths to the
  pre-generated variants. Seeded and migrated images on Unsplash or Cloudinary use those
  providers' resizing.
- Accepted image sources are allow-listed in validation (`mediaSrc`): our storage, `/images`,
  Unsplash and Cloudinary.
- Deleting a listing removes its image folders after the response (`after()`). **Known gap:**
  images uploaded in the editor but removed again before the first save are never referenced, so
  they are not cleaned up automatically (see the backlog in the README).

## Search

`src/lib/search/params.ts` parses untrusted URL parameters into a typed query: unknown values
are dropped, ranges normalised, and nothing object-shaped reaches MongoDB.
`src/server/search/property-filter.ts` builds the filter. `mongoPropertySearch` (in
`src/server/search/property-search.ts`) uses the text index first, then falls back to an escaped,
bounded regex for partial words. Price-on-request listings stay visible under price filters.

The map view (`/properties/map`) lazy-loads MapLibre GL with OpenFreeMap tiles (no API key). The
MapLibre worker is emitted as a hashed static asset (`src/components/maps/maplibre.ts`).

## Security headers

`next.config.ts` sends a static CSP (nonces are incompatible with prerendering), HSTS,
`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and
COOP. Frames are allow-listed to YouTube (nocookie), Vimeo, Matterport, Kuula and Momento360.

## Analytics

- **First-party events.** `POST /api/events` is anonymous and rate-limited, accepts only
  allow-listed event names, and aggregates into `daily_metrics` for the admin dashboard. It sets
  no cookies; the rate limiter keeps a salted, expiring hash of the IP address.
- **Vercel Web Analytics and Speed Insights** render only when deployed on Vercel.

## Key decisions

| Decision                                 | Why                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Rebuild instead of refactor              | The legacy app had critical security flaws and no reusable domain model (see the audit).                           |
| MongoDB kept                             | The brief required it; the domain (listings with nested media, specs and location) fits documents well.            |
| One shared MongoClient                   | A single connection pool per function instance for both Better Auth and Mongoose (`attachDatabasePool` on Vercel). |
| Better Auth instead of a hosted provider | Accounts stay in the project's own database, legacy bcrypt hashes can be migrated, and there is no extra vendor.   |
| Static CSP with `'unsafe-inline'`        | Nonce-based CSP forces every page to render dynamically, defeating prerendering.                                   |
| `partialPrefetching: false`              | Correct 404 status codes for unknown detail URLs (see above).                                                      |
| Snapped coordinates by default           | Privacy: maps show a ~1 km area unless an editor explicitly shows the exact location.                              |
