# Environment

Configuration is read from environment variables. Server variables are validated on first use
by `src/lib/env.ts`, which fails with a list of exactly what is missing. Copy `.env.example` to
`.env.local` for development. `.env*` files other than `.env.example` are git-ignored; never
commit real values.

## Variables

| Variable                              | Required    | Used for                                                                                                                                                                                                               |
| ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                         | yes         | MongoDB connection string **including the database name**                                                                                                                                                              |
| `BETTER_AUTH_SECRET`                  | yes         | Signs sessions and salts hashed identifiers (min 32 chars; `openssl rand -base64 48`). Changing it signs everyone out.                                                                                                 |
| `NEXT_PUBLIC_SITE_URL`                | production  | Canonical origin (no trailing slash) for metadata, sitemap, emails and auth. On Vercel it falls back to `VERCEL_PROJECT_PRODUCTION_URL`. It is inlined at build time, so redeploy after changing it.                   |
| `BETTER_AUTH_URL`                     | no          | Auth origin; defaults to the site URL                                                                                                                                                                                  |
| `MEDIA_STORAGE`                       | no          | `blob` or `local`. Defaults to `blob` when `BLOB_READ_WRITE_TOKEN` is set. On Vercel production, local storage is rejected.                                                                                            |
| `BLOB_READ_WRITE_TOKEN`               | production  | Vercel Blob access, injected when a Blob store is connected to the project                                                                                                                                             |
| `RESEND_API_KEY`, `EMAIL_FROM`        | recommended | Password-reset emails and lead notifications. Without them, enquiries are still stored and shown in the admin, but "Forgot password" is unavailable (which also blocks migrated users whose legacy hash was unusable). |
| `LEAD_NOTIFICATION_EMAIL`             | no          | Inbox notified of every new enquiry (the assigned advisor is also notified)                                                                                                                                            |
| `NEXT_PUBLIC_SITE_NAME`               | no          | Brand name (default "TanvirDev Property")                                                                                                                                                                              |
| `NEXT_PUBLIC_DEFAULT_CURRENCY`        | no          | Currency used to label search price filters and filter chips (default `BDT`). Each listing's own price keeps its currency.                                                                                             |
| `NEXT_PUBLIC_MAP_STYLE_URL`           | no          | MapLibre style URL (default OpenFreeMap "positron", no key)                                                                                                                                                            |
| `ADMIN_PASSWORD`                      | scripts     | Password for `npm run admin:create`; if empty, a random one is generated and written to `.admin-credentials.local` (git-ignored)                                                                                       |
| `LEGACY_MONGODB_URI`                  | scripts     | Source database for `npm run db:migrate-legacy`                                                                                                                                                                        |
| `SEED_CONFIRM`, `MIGRATE_CONFIRM`     | scripts     | Explicit confirmations required before scripts write to a non-local database                                                                                                                                           |
| `TEST_MONGODB_URI`, `E2E_MONGODB_URI` | tests       | Override the disposable local test databases (names must end in `_test` / `_e2e`)                                                                                                                                      |

Vercel also provides `VERCEL`, `VERCEL_ENV` and `VERCEL_PROJECT_PRODUCTION_URL`. They decide
whether robots.txt blocks indexing (any non-production deployment is blocked) and whether Vercel
Analytics loads.

## Local development

Requirements: Node.js ≥ 22.12, Docker (or any MongoDB 8 replica set).

```bash
docker run -d --name estate-mongo -p 27017:27017 -v estate-mongo-data:/data/db mongo:8 --replSet rs0 --bind_ip_all
```

```bash
docker exec estate-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

`.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/tanvirdev_property?replicaSet=rs0&directConnection=true
BETTER_AUTH_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MEDIA_STORAGE=local
```

```bash
npm install
```

```bash
npm run db:indexes
```

```bash
npm run db:seed
```

```bash
npm run admin:create -- --email=you@example.com --name="Your Name"
```

```bash
npm run dev
```

The generated admin password is written to `.admin-credentials.local`. Uploaded media is stored
under `.data/media/` and served by `/media/[...path]`, in development only.

`npm install` on npm 11 does not run dependency install scripts by default. `sharp` ships
prebuilt binaries and does not need them; if npm reports blocked scripts, review them with
`npm install-scripts ls`.
