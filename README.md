# TanvirDev Property

A real-estate discovery and lead-generation platform for premium homes in Bangladesh: listings for
sale and to rent, location guides, advisors, editorial insights, client accounts and a full
administration area. It replaces the earlier MERN application (see
[docs/LEGACY-AUDIT.md](docs/LEGACY-AUDIT.md) for why it was rebuilt rather than refactored).

**Stack:**

- Next.js 16 (App Router, Cache Components, React Compiler), React 19, TypeScript (strict)
- Tailwind CSS 4, Base UI, Motion
- MongoDB 8 with Mongoose 9
- Better Auth
- Zod
- sharp + Vercel Blob for media
- MapLibre GL + OpenFreeMap for maps
- Vitest + Playwright + axe-core for tests

## Features

**Visitors**

- Home page with hero search, featured, exclusive and latest residences, locations and insights
- Search at `/properties`:
  - filters for transaction, type, location, price, bedrooms, bathrooms, area, amenities,
    furnishing, parking, availability and flags
  - sorting and pagination
  - shareable URLs and active-filter chips
  - quick view
- Map search at `/properties/map`: clustered markers; approximate locations unless an exact
  location is enabled
- Property pages:
  - gallery with lightbox, floor plans, video and virtual tour embeds (allow-listed providers)
  - specifications and amenities
  - approximate-location map, mortgage calculator, share
  - advisor card and enquiry or viewing-request form
  - similar homes
- Comparison of up to four homes, and a recently viewed strip
- Location guides (city and neighbourhood), advisor profiles, insights with categories, plus
  About, Services, Contact, Privacy and Terms pages

**Clients** (accounts with email and password)

- Saved homes and saved searches (stored in the database)
- Enquiry history, profile settings, password change
- Password reset by email (when email is configured)

**Staff** (`/admin`, role-based: advisor, editor, administrator)

- Dashboard with enquiry trend and engagement metrics
- Listings: create, edit, publish, archive, delete; photo and floor-plan upload with alt text and
  ordering; map pin; SEO fields
- Enquiries: status pipeline, assignment, internal notes, history
- Advisors, location guides, insights (Markdown with preview), users (roles, disable), site
  settings, audit log

**Platform**

- **Security:** server-side checks on every action; rate limits; strict security headers; hashed
  IPs; sanitised Markdown; private addresses never exposed.
- **SEO:** canonical URLs and noindex rules for filtered searches; real 404s; sitemap and robots;
  JSON-LD. See [docs/SEO.md](docs/SEO.md).
- **Accessibility:** axe WCAG 2.2 AA checks in end-to-end tests; keyboard support; reduced-motion
  support.

## Quick start

Full instructions are in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

```bash
docker run -d --name estate-mongo -p 27017:27017 -v estate-mongo-data:/data/db mongo:8 --replSet rs0 --bind_ip_all
```

```bash
docker exec estate-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

```bash
cp .env.example .env.local
```

Set `MONGODB_URI` and `BETTER_AUTH_SECRET` in `.env.local`, then:

```bash
npm install
```

```bash
npm run db:indexes && npm run db:seed
```

```bash
npm run admin:create -- --email=you@example.com --name="Your Name"
```

```bash
npm run dev
```

The seed loads clearly labelled **demonstration data** (fictional advisors, sample listings).
Don't load it into a production database that will hold real listings.

## Scripts

| Script                                              | Purpose                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `dev`, `build`, `start`                             | Next.js                                                             |
| `typecheck`, `lint`, `format`, `format:check`       | Static checks                                                       |
| `test`, `test:unit`, `test:integration`, `test:e2e` | Tests ([docs/TESTING.md](docs/TESTING.md))                          |
| `db:indexes`                                        | Sync MongoDB indexes, including Better Auth's                       |
| `db:seed`                                           | Load demonstration data (local only unless explicitly confirmed)    |
| `db:migrate-legacy`                                 | Migrate users and listings from the legacy app (dry run by default) |
| `admin:create`                                      | Create or promote a staff account                                   |
| `media:build-static`                                | Generate image variants for files in `public/images`                |

## Documentation

- [Architecture](docs/ARCHITECTURE.md): structure, data flow, caching, auth, media, decisions
- [Database](docs/DATABASE.md): collections, indexes, data rules, seed and migration
- [Environment](docs/ENVIRONMENT.md): variables and local setup
- [Testing](docs/TESTING.md): test suites and current results, including Lighthouse
- [SEO](docs/SEO.md): what is implemented and what to do after launch
- [Deployment](docs/DEPLOYMENT.md): Vercel, Atlas, Blob, domain and verification
- [Legacy audit](docs/LEGACY-AUDIT.md): findings on the previous application

## Project structure

```
src/
  app/            routes: (site) public pages, (auth), account, admin, api, media
  components/     UI by area (admin, property, search, maps, layout, ui, …)
  config/         site, domain and property option constants
  lib/            auth, db, env, validation, search params, media, security, formatting
  server/         models, mappers/DTOs, cached queries, services, server actions
scripts/          seed, index sync, admin creation, legacy migration
tests/            unit, integration, e2e (+ setup)
```

## Status

- Implemented and verified locally:
  - typecheck, lint and format check are clean
  - 84 unit and integration tests pass
  - 23 Playwright journeys pass against a production build
- **Live at https://estate.tanvirdev.site** (Vercel `bom1`, MongoDB Atlas Mumbai, Vercel Blob)
  with the labelled demonstration catalogue. The setup and redeploy steps are in
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Known gaps and backlog:

- **Mobile performance.** Lab mobile Performance scores are 56–62; hydration JavaScript is the
  main cost. Details in [docs/TESTING.md](docs/TESTING.md).
- **Orphaned uploads.** Photos uploaded in the editor and removed before the first save are not
  deleted from storage automatically. A periodic clean-up job is needed.
- **Legacy images.** Listings migrated from the legacy app keep their images on the old
  Cloudinary account.
- **Content.** All seeded content is demonstration data. Real listings, advisors, photographs and
  copy need to be added before launch.
