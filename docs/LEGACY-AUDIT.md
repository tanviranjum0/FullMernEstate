# Legacy Application Audit

Audit date: 2026-10-08. Audited commit: `5bb60a9` (branch `main`).

> The legacy source has since been removed from the working tree. It is preserved in git history
> under `legacy/` at commit `d2190ce` (tag `legacy-app`):
>
> ```bash
> git show legacy-app:legacy/back/app.js
> ```

This document records what the legacy "MERN Estate" application was, how it behaved when actually run, and why it is being replaced rather than refactored. Every security finding marked **verified** was reproduced against a locally running copy of the legacy server (MongoDB 8 in Docker, throwaway local secrets). Nothing was run against any production system.

## How the audit was performed

- Read every tracked source file (66 files: 13 backend, 30 frontend source, assets, configs).
- Checked the published deployments: `https://full-mern-estate.vercel.app` (the repository's homepage URL) returns Vercel `DEPLOYMENT_NOT_FOUND`; `https://rt-estate.vercel.app` (in the CORS allow-list) does not respond. **No live legacy data or UI exists to migrate from.**
- `back/.env` exists locally but is empty, so the original database and Cloudinary account are not reachable from this machine.
- Installed dependencies with `npm ci`, ran `npm audit`, built the Vite frontend, started the Express server against a local MongoDB, seeded legacy-shaped documents, and exercised the UI in a browser and the API with a scripted probe.

## 1. Existing architecture

| Layer         | Implementation                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | React 18 SPA, Vite 7, React Router 6, Tailwind CSS 3, Swiper, `react-type-animation`, `react-lazy-load-image-component`. Redux Toolkit, redux-persist, SWR, axios and react-cookie are installed but **unused**. |
| Backend       | Express 4 (CommonJS), Mongoose 8, JWT (`jsonwebtoken`), bcrypt, multer (disk storage), Cloudinary SDK, EJS (one unused "Hello" view).                                                                            |
| Hosting model | Root `package.json` builds the SPA and the Express server serves `front/dist` plus a catch-all `*` → `index.html`.                                                                                               |
| State         | A React Context fetches 9 sale + 9 rent listings on every app load. Logged-in user data (including the JWT) is stored in `localStorage`.                                                                         |
| Data flow     | Images are uploaded **from the browser directly to Cloudinary** with an unsigned upload preset (`VITE_UPLOAD_PRESET`), then the returned Cloudinary JSON is posted to the API and stored verbatim.               |

There is no TypeScript, no tests, no CI, no README for the project (the frontend README is the Vite template), and no documentation.

## 2. Existing functionality

| Feature                                              | State when run                                                                                                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page                                            | Hero image with typewriter headline "Nobody does it better!", then two unfiltered grids: "Recent Sale Offers" and "Recent Rent Offers". Listing images are stuck in the lazy-load blur state for over a second.      |
| Search (`/search`)                                   | Keyword (title regex only), type (all/rent/sale), offer, parking, furnished, sort by price/date. Filters are mirrored into the query string. "Show more" pagination. Uses checkboxes for mutually-exclusive choices. |
| Listing detail (`/listing/:id`)                      | Swiper carousel of CSS background images, price, address, beds/baths/parking/furnished, description. **"Contact Owner" shows `alert()` saying the contact form is disabled.**                                        |
| Sign up                                              | Username, email, password, required avatar (uploaded directly to Cloudinary). The "email exists" pre-check is inverted (see §8).                                                                                     |
| Sign in                                              | Email + password; stores the full login response (including the JWT) in `localStorage`.                                                                                                                              |
| Profile (`/profile/:id`)                             | Avatar, name, email, own listings with edit/delete, logout, delete account.                                                                                                                                          |
| Create / edit listing                                | Name, description, address, sale/rent, parking, furnished, offer, beds, baths, regular price, discount price, up to 6 images (2 MB each).                                                                            |
| About                                                | Copy describing "RoksanaProperty"/"Bproperty" (see §9).                                                                                                                                                              |
| Contact component                                    | `Contact.jsx` exists but is not used anywhere; it would have fetched the owner by **user id from an email-lookup route** and built a `mailto:` link.                                                                 |
| Footer                                               | "Best Locations" (USA, CANADA, "FRANCH", DUBAI) and "Legal" items are non-interactive `<li>` elements with no links.                                                                                                 |
| Admin                                                | **None.** There are no roles; any registered user can create listings.                                                                                                                                               |
| Favorites, maps, agents, inquiries, comparison, blog | **None.**                                                                                                                                                                                                            |

## 3. Existing routes (frontend)

`/`, `/about`, `/search`, `/listing/:id`, `/login`, `/sign-up`, `/create-listing`, `/edit-listing/:id`, `/profile/:id`, `/test` (a stub page that renders "Holla"). Unknown routes render the empty SPA shell with HTTP 200 (soft 404).

## 4. Existing APIs

| Method & path                          | Auth     | Notes                                                                                                        |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `GET /api/auth/check-login`            | cookie   | Returns 204 with a JSON body on failure.                                                                     |
| `POST /api/auth/signup`                | none     | **Returns the full user document including the bcrypt hash.**                                                |
| `POST /api/auth/login`                 | none     | Returns the JWT in the JSON body **and** a signed cookie. Failure responses are HTTP 200 with a string body. |
| `GET /api/auth/signout`                | none     | State change via GET; `clearCookie` without matching cookie options.                                         |
| `POST /api/user/update/:id`            | JWT      | IDOR (see §10).                                                                                              |
| `DELETE /api/user/delete/:id`          | JWT      | Deletes user, their listings and Cloudinary images.                                                          |
| `GET /api/user/listings`               | JWT      | Unused by the UI.                                                                                            |
| `GET /api/user/:email`                 | **none** | Public user lookup by email.                                                                                 |
| `POST /api/listing/create`             | JWT      | Body passed straight to `Listing.create`.                                                                    |
| `POST /api/listing/update/:id`         | JWT      | Body passed straight to `findByIdAndUpdate`.                                                                 |
| `DELETE /api/listing/delete/:id`       | JWT      | Owner check present.                                                                                         |
| `DELETE /api/listing/delete-image/:id` | JWT      | Deletes all Cloudinary images of a listing.                                                                  |
| `GET /api/listing/get/:id`             | none     | 400 (not 404) when missing.                                                                                  |
| `GET /api/listing/get`                 | none     | Search; see injection findings.                                                                              |
| `GET /api/listing/user-listings/:id`   | JWT      | Returns 204 with a body on mismatch.                                                                         |
| `POST /api/listing/create-upload`      | JWT      | Multer disk upload into the public static folder. Unused by the UI.                                          |

## 5. Existing database models

**User**: `username` (unique), `email` (unique), `password` (bcrypt, cost 10), `avatar` (raw Cloudinary response object), timestamps.

**Listing**: `name`, `description`, `address` (free text), `regularPrice`, `discountPrice` (required even when there is no offer), `bathrooms`, `bedrooms`, `furnished`, `parking`, `offer` (booleans), `type` (free string; UI uses `sale`/`rent`), `imageUrls` (untyped `Object`, an array of raw Cloudinary responses), `userRef` (ObjectId → User), timestamps.

No indexes beyond the two unique constraints. No validation of ranges, enums, or price consistency. No slugs, no status/draft concept, no location structure, no coordinates, no area, no property type.

## 6. Existing integrations

- **MongoDB** via `MONGO` env var (credentials not available).
- **Cloudinary**: server-side SDK (deletes) + browser-side unsigned uploads via `VITE_CLOUDINARY_API`, `VITE_UPLOAD_PRESET`, `VITE_CLOUD_NAME`.
- No email, analytics, maps, or payments.

Required legacy env vars (reconstructed from code, since no `.env.example` existed): `MONGO`, `JWT_SECRET`, `COOKIE_SECRET`, `PORT`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `VITE_CLOUDINARY_API`, `VITE_UPLOAD_PRESET`, `VITE_CLOUD_NAME`.

## 7. Existing assets worth preserving

| Asset                                                            | Verdict                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Brand name "TanvirDev Property" (navbar wordmark)                | Kept as the default brand name; now configurable in site settings.                         |
| `re7.jpg` (6016×2323 seaside villa at sunset)                    | Strong hero image. Reused (re-encoded) as development seed media.                          |
| `re8.png` (modern villa with pool), `re10.png` (bright interior) | Good quality. Reused as development seed media.                                            |
| `re6.jpg`, `re9.png`, `re11.png` (suburban houses), `ew11.png`   | Not consistent with a luxury positioning; not reused.                                      |
| `re2`–`re5.png` (~350 px wide renders)                           | Too low resolution; not reused.                                                            |
| `favicon.png`                                                    | A 1.2 MB, 3456×5184 photograph of keys used as a favicon. Replaced with a vector mark.     |
| `back/public/my-uploads/*`                                       | Test uploads (a concert photo and a website screenshot). Not property media; not migrated. |
| Legacy colour `#a2b8db` (slate blue)                             | Its hue informs the new deep "harbour" accent; the washed-out tint itself is retired.      |

**Licensing note:** the legacy photographs carry no attribution or licence record in the repository. They appear to be free stock photography; confirm the licence before using them anywhere other than development seed data.

## 8. Functionality to improve (rebuild properly)

- **Search**: replace title-only regex with indexed keyword search + structured filters (location, property type, price/area ranges, beds/baths, amenities, status, flags), canonical URL state, real pagination, empty/loading/error states.
- **Listing detail**: real gallery (keyboard, touch, fullscreen), structured specs, map, agent card, working inquiry and viewing-request forms that persist to the database.
- **Pricing model**: `regularPrice` + `discountPrice` + `offer` becomes `price` + optional `previousPrice` (price-reduced badge) + `priceOnRequest`.
- **Listing ownership**: free-for-all user listings become admin/agent-managed inventory with draft/publish workflow and audit logging.
- **Profile**: becomes an account area with saved properties, saved searches, inquiry history and settings.
- **Sign-up**: drop the mandatory avatar upload; add proper validation, rate limiting and session security.
- **Edit listing**: currently reads the listing from `localStorage`, **swaps bedrooms and bathrooms** when pre-filling the form (`bedrooms: listing.bathrooms`), and deletes all existing images before uploading replacements without waiting for the uploads to finish.
- **Sign-up email check is inverted**: `if (!existed.data)` treats "user found" as "email taken" only when the lookup returns no `data` key, so the pre-check passes for existing users and the server then returns HTTP 200 "This email is already exist...".
- **Create listing validation** uses `&&` instead of `||`, so it only fails when _all three_ text fields are empty.
- **Image upload race**: `images.forEach(async …)` calls `createListing()` when the _last-indexed_ upload finishes, not when all uploads finish, so listings can be saved with missing images.

## 9. Functionality to remove

- `/test` route and `Test.jsx` ("Holla").
- Unused EJS view engine and `views/index.ejs`; unused dependencies (Redux Toolkit, redux-persist, SWR, axios, react-cookie, react-loader-spinner, react-lazy-load).
- `src/assets/listings.js` static sample data (eight identical "Lavish Lives" entries with string prices).
- The `alert()` "contact form is disabled" stub.
- The About page copy. It names a third-party company ("Bproperty") and makes unverifiable claims ("the only real estate solutions provider in the World and its largest transacting real estate company"). This must not be carried over.
- Public user lookup by email, token-in-response-body, `localStorage` session handling.
- Direct browser-to-Cloudinary unsigned uploads.

## 10. Security issues

| #   | Severity | Finding                                                                                                                                                                                                                                                                                                                                | Evidence                                                                                                                                       |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Critical | **Unauthenticated denial of service.** `checkLogin` sends a response when JWT verification fails but still calls `next()`. The handler then throws while trying to respond again; the unhandled error terminates the Node process. One request with any bogus `Authorization` header takes the whole site down.                        | **Verified**: `POST /api/listing/create` with `Authorization: garbage` → server exited (`ECONNREFUSED` afterwards).                            |
| S2  | Critical | **IDOR / account tampering.** `updateUser` replies "You can only update your own account!" but does not `return`, so the update still runs against the victim's account (username, email, avatar; a supplied password is assigned an un-awaited `bcrypt.hash` promise). The same request also crashes the server (headers sent twice). | **Verified**: user A renamed user B (`pwned…`), then the server exited with `ERR_HTTP_HEADERS_SENT`.                                           |
| S3  | Critical | **Stored XSS via uploads.** `/api/listing/create-upload` accepts any file type with the client-supplied filename and stores it in `public/my-uploads`, which Express serves from the application origin. An uploaded HTML/SVG file executes script in the site's origin.                                                               | **Verified**: uploaded `probe.html` was served back as `text/html` from `localhost:4000/my-uploads/…` (the probe file was deleted afterwards). |
| S4  | High     | **Mass assignment.** Listing create/update pass `req.body` straight to Mongoose: a user can transfer ownership (`userRef`), set negative prices, or write arbitrary fields.                                                                                                                                                            | **Verified**: user A set `userRef` to user B and `regularPrice` to `-5`.                                                                       |
| S5  | High     | **NoSQL operator injection.** Express's extended query parser turns `type[$ne]=x` into `{ $ne: "x" }`, passed straight into `Listing.find`. The login `email` field also accepts operators (`{"$ne": null}` matched the first user).                                                                                                   | **Verified** on `/api/listing/get?type[$ne]=zzz&offer[$exists]=true` and on login.                                                             |
| S6  | High     | **Password hash disclosure.** Sign-up responds with the full user document including the bcrypt hash.                                                                                                                                                                                                                                  | **Verified**.                                                                                                                                  |
| S7  | High     | **User enumeration / PII exposure.** `GET /api/user/:email` is unauthenticated and returns id, username, email, avatar and timestamps. Login responses also differ between "No user found" and "Wrong Credentials".                                                                                                                    | **Verified**.                                                                                                                                  |
| S8  | High     | **Session design.** JWTs never expire, are returned in the response body, and are persisted in `localStorage` (readable by any XSS). There is no revocation; logout uses GET and may not clear the cookie because `clearCookie` omits the original `secure`/`sameSite` options.                                                        | Code review.                                                                                                                                   |
| S9  | Medium   | **Unsigned client-side Cloudinary uploads.** Anyone who reads the bundle can upload arbitrary files to the Cloudinary account.                                                                                                                                                                                                         | Code review.                                                                                                                                   |
| S10 | Medium   | **User-controlled regex and sort field** (`searchTerm` used unescaped in `$regex`; `sort` accepts any field name). ReDoS risk and unindexed sorts on attacker-chosen fields.                                                                                                                                                           | Verified that patterns such as `(a+)+$` and arbitrary sort fields are accepted.                                                                |
| S11 | Medium   | **No rate limiting, no input validation, no security headers** (`X-Powered-By: Express` exposed; no CSP, HSTS, frame or content-type protections).                                                                                                                                                                                     | Verified response headers.                                                                                                                     |
| S12 | Medium   | **Vulnerable dependencies.** `npm audit`: backend 11 vulnerabilities (2 critical, 6 high, 3 moderate; `tar` via `bcrypt`'s `node-pre-gyp`); frontend 29 vulnerabilities (1 critical `swiper` prototype pollution, 18 high incl. Vite dev-server path traversal).                                                                       | `npm audit` output.                                                                                                                            |
| S13 | Low      | Dead CORS middleware registered _after_ the routes would set `Access-Control-Allow-Origin: *` with credentials if it ever ran.                                                                                                                                                                                                         | Code review.                                                                                                                                   |

## 11. SEO problems

- Pure client-side rendering: every URL returns the same 470-byte HTML shell with `<title>Estate</title>` and an empty `<div id="root">`. Crawlers that do not execute JavaScript see no content; those that do see no metadata.
- No per-page titles, descriptions, canonicals, Open Graph or Twitter metadata; no structured data.
- No `robots.txt` or `sitemap.xml` (both URLs return the SPA shell with HTTP 200).
- Soft 404s: unknown URLs and missing listings return HTTP 200.
- Non-descriptive URLs (`/listing/<ObjectId>`); no location or agent landing pages.
- Images rendered as CSS backgrounds or with `alt="listing cover"`/empty alt text.
- Heading hierarchy is not semantic (most text is in `div`s; the page has no `h1` on several routes).

## 12. Performance problems

- 334 KB JavaScript (101 KB gzipped) for a handful of pages, including unused libraries; no code splitting.
- Hero is a 900 KB JPEG used as a CSS background (no responsive sizes, no modern formats, cannot be prioritised); About uses a fixed `height: 1000px` background.
- 1.2 MB favicon.
- Listing images are full-size Cloudinary originals; the lazy-load wrapper adds a 1 s transition delay.
- Every page load makes two listing API calls from the root context, whether or not the page needs them.
- No database indexes for the search filters or sorts; regex search cannot use an index.

## 13. UX problems

- Visual design: washed-out blue backgrounds (`#a2b8db`), mismatched typography (mono labels, mixed weights), default Tailwind form styling, inconsistent spacing; reads as a tutorial project.
- Placeholder/motivational copy on the home page ("Becoming a real estate attorney is a tough job…").
- Checkboxes used for mutually exclusive options; the mobile menu toggle is a literal "=" and "X" character.
- Errors shown as raw server strings; `alert()` used for a primary CTA; confirmation dialogs are hand-toggled `div`s without focus management.
- No empty, loading or error states beyond "Loading..." text; no feedback on many actions.
- Accessibility: clickable `div`s instead of buttons, labels not associated with inputs (`htmlFor` mismatches), no focus styles, images without meaningful alt text, no keyboard support in dialogs.

## 14. Architecture problems

- Business logic, authorization and persistence mixed in route handlers; inconsistent HTTP semantics (errors returned as 200/204 with string bodies).
- Async errors not handled (Express 4 + `async` handlers), so several faults crash the process.
- Client-trusted data everywhere (owner IDs, prices, image metadata).
- Cross-component communication through `localStorage` keys (`ListingToBeEdited`, `ListingToBeDeleted`) and direct DOM manipulation (`classList.toggle`).
- No environment validation, no logging strategy, no tests, no type safety.

## 15. Recommended replacement architecture

Rebuild as a single **Next.js 16 (App Router) + React 19 + TypeScript** application deployed on **Vercel**, with **MongoDB** retained (the data is document-shaped and the business requirements do not justify a database change).

- **Rendering**: Server Components by default, Cache Components (`'use cache'` + tags) for public catalogue data, streaming with Suspense for personalised fragments; client components only for genuinely interactive pieces (filters, gallery, map, forms).
- **Data**: Mongoose models with validation and purpose-built indexes, a cached connection, DTO mapping (no raw documents cross the server boundary), service functions that own business rules, thin Server Actions/Route Handlers that authenticate, authorise, validate (Zod) and delegate.
- **Auth**: Better Auth with database sessions in MongoDB, HTTP-only secure cookies, built-in rate limiting, role-based authorisation enforced server-side (`user`, `agent`, `editor`, `admin`), compatible with legacy bcrypt hashes for migration.
- **Media**: server-side upload endpoint that validates by decoding (sharp), strips metadata, resizes and re-encodes to WebP, records dimensions and a blur placeholder, and stores in **Vercel Blob**; `next/image` delivery with responsive sizes.
- **Search**: MongoDB compound + text + geospatial indexes behind a search-engine interface so Atlas Search or another engine can replace it later.
- **SEO**: Metadata API per route, canonical URL strategy for filters, dynamic sitemap, robots, JSON-LD (Organization, WebSite, BreadcrumbList, Article, Person), slug-based URLs, location/agent/editorial landing pages.
- **Leads**: inquiries and viewing requests persisted with status workflow, assignment and notes; optional email notifications; privacy-preserving first-party event counters.
- **Quality**: strict TypeScript, ESLint, Vitest unit/integration tests against real MongoDB, Playwright end-to-end tests, environment validation at startup.

The detailed design is in [ARCHITECTURE.md](./ARCHITECTURE.md).
