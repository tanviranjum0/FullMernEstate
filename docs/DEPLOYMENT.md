# Deployment

Target: **Vercel** (Fluid compute, Node.js runtime) + **MongoDB Atlas** (via the Vercel
Marketplace) + **Vercel Blob** for media. Email is optional (**Resend**).

## Current production setup (deployed 2026-10-08)

| Item                               | Value                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL                                | https://estate.tanvirdev.site                                                                                                                           |
| Vercel project                     | `estate` (scope `tanviranjum010`), deployed with the CLI from a working copy; not connected to Git                                                      |
| Functions region                   | `bom1` (Mumbai), pinned in `vercel.json` next to the database                                                                                           |
| Database                           | MongoDB Atlas `cluster0` (AWS `ap-south-1`), database `tanvirdev_property`                                                                              |
| Media                              | Vercel Blob store `estate-media` (public, `bom1`), connected to all environments                                                                        |
| Environment variables (Production) | `MONGODB_URI`, `BETTER_AUTH_SECRET` (secrets), `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `BLOB_READ_WRITE_TOKEN`                                       |
| DNS (Cloudflare)                   | `CNAME estate → cname.vercel-dns.com` (DNS only) and `TXT _vercel` ownership verification                                                               |
| Content                            | Labelled demonstration catalogue (site-wide "sample data" announcement)                                                                                 |
| Email                              | Not configured, so password reset is unavailable                                                                                                        |
| Web Analytics / Speed Insights     | Not enabled. Web Analytics is free but must be confirmed interactively (`vercel project web-analytics enable estate`). Speed Insights is a paid add-on. |

To redeploy after changes, run this from the repository root (linked via `.vercel/project.json`):

```bash
vercel deploy --prod
```

`.vercelignore` keeps `.env*`, credential files and `.data/` out of the upload.

To run a script against production, use the git-ignored `.env.deploy-production` (never loaded by
Next.js):

```bash
npx tsx --env-file=.env.deploy-production scripts/sync-indexes.ts
```

### Removing the demonstration content

1. In `/admin`, delete the sample listings, advisors and articles.
2. Clear the announcement in Site settings.
3. Keep the locations if they match the areas you serve, and edit their guides.

The sections below describe how this setup was created, for reference or for a fresh
environment.

## 1. Decisions to make first

| Decision        | Options                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand name      | Keep "TanvirDev Property" or set `NEXT_PUBLIC_SITE_NAME`                                                                                                                |
| Domain          | e.g. `estate.tanvirdev.site`. DNS is managed outside Vercel, so a CNAME must be added at your DNS provider.                                                             |
| Production data | **Recommended:** start empty and add real listings in `/admin`. Alternatively load the labelled demo data for a showcase (it carries a site-wide "sample data" banner). |
| Email           | Resend account and a verified sending domain, so password reset and lead notifications work                                                                             |

## 2. Create the project

```bash
vercel link
```

Link the repository (`github.com/tanviranjum0/FullMernEstate`) to a new project. The framework
preset is Next.js; no build settings need overriding (`npm run build`). Set the Node.js version to
22.x or later.

## 3. Provision storage

```bash
vercel integration add mongodbatlas
```

This creates an Atlas cluster and injects `MONGODB_URI`. The app requires the **database name**
in the URI (`…mongodb.net/tanvirdev_property?retryWrites=true&w=majority`); if the injected
value has none, override `MONGODB_URI` for Production with one that does. Use an M10+ tier (or
enable continuous backup) for real data.

Create a Blob store (Vercel dashboard → Storage → Blob) and connect it to the project. This injects
`BLOB_READ_WRITE_TOKEN`. On Vercel production the configuration check (`src/lib/env.ts`) fails
without it, because local disk is not persistent there; the runtime logs name the missing
variable.

## 4. Environment variables (Production, plus Preview if used)

```bash
vercel env add BETTER_AUTH_SECRET production
```

Use a value from `openssl rand -base64 48`, and a different one for Preview.

```bash
vercel env add NEXT_PUBLIC_SITE_URL production
```

Use `https://<your-domain>` with no trailing slash. Optional variables are `RESEND_API_KEY`,
`EMAIL_FROM`, `LEAD_NOTIFICATION_EMAIL` and `NEXT_PUBLIC_SITE_NAME` (see
[ENVIRONMENT.md](ENVIRONMENT.md)).

Preview deployments should use a **separate** database (a second Atlas database or cluster).
robots.txt already blocks indexing on every non-production deployment.

## 5. Deploy

```bash
vercel deploy --prod
```

Or push to the production branch once Git integration is connected.

## 6. Initialise the production database

Run these from a trusted machine with the production connection string in the shell (not in a
committed file):

```bash
MONGODB_URI="<production uri>" npm run db:indexes
```

```bash
MONGODB_URI="<production uri>" npm run admin:create -- --email=you@yourdomain.com --name="Your Name"
```

`admin:create` writes a generated password to `.admin-credentials.local` (git-ignored). Sign in,
change it under Account → Settings, then delete that file. You can also set `ADMIN_PASSWORD` in
the shell.

Only if you chose demo data:

```bash
MONGODB_URI="<production uri>" SEED_CONFIRM=demo-data npm run db:seed -- --allow-remote
```

Then, in `/admin`:

- add locations (cities and neighbourhoods) before listings
- add advisors
- complete Site settings: contact details, social links, About, and the announcement (clear it
  when no demo data is shown)

## 7. Domain

```bash
vercel domains add estate.tanvirdev.site
```

Create the DNS record the command prints (usually `CNAME estate → cname.vercel-dns.com`) at your
DNS provider. Then set `NEXT_PUBLIC_SITE_URL` to the domain and redeploy. Vercel issues the TLS
certificate automatically.

## 8. Verify the live site

```bash
curl -sI https://<domain>/ | grep -i "strict-transport\|content-security"
```

```bash
curl -s https://<domain>/robots.txt
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/properties/does-not-exist
```

The last one should return `404`. Also check:

- [ ] `https://<domain>/sitemap.xml` lists the production domain
- [ ] Sign up, sign in and sign out work; `/admin` is refused for non-staff
- [ ] Upload a photo in `/admin/properties/new`; the image URL is on `*.public.blob.vercel-storage.com`
- [ ] Submit a test enquiry, check it appears in `/admin/inquiries`, then mark it as spam
- [ ] Vercel → Observability shows no runtime errors; Speed Insights starts collecting field data

## Rollback

```bash
vercel rollback
```

This promotes the previous deployment instantly. Schema changes are additive and indexes are
synced separately, so rolling the code back does not require a database rollback.

## Running the tests in CI

Integration and E2E tests need a MongoDB replica set. In CI, start `mongo:8 --replSet rs0` as a
service and run `rs.initiate()` (see [TESTING.md](TESTING.md)). Then:

```bash
npm ci
```

```bash
npm run typecheck && npm run lint && npm test
```

```bash
npx playwright install --with-deps chromium && npm run test:e2e
```
