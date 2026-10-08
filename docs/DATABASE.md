# Database

MongoDB 8 with the Node driver 7 and Mongoose 9. Better Auth and Mongoose share one `MongoClient`
(see [ARCHITECTURE.md](ARCHITECTURE.md)). Transactions require a replica set, so local
development uses a single-node replica set (see [ENVIRONMENT.md](ENVIRONMENT.md)) and production
uses MongoDB Atlas.

## Collections

| Collection                                                | Owner                           | Purpose                                                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `properties`                                              | `src/server/models/property.ts` | Listings: status, transaction, type, price, specs, amenities, location (public and private address, GeoJSON point), images, floor plans, video and tour, advisor, SEO, legacy ids |
| `agents`                                                  | `agent.ts`                      | Advisor profiles, optionally linked to a user account (`userId`)                                                                                                                  |
| `locations`                                               | `location.ts`                   | City and neighbourhood guides (`kind`, `slug`, `parentSlug`) with highlights, FAQs and map centre                                                                                 |
| `articles`                                                | `article.ts`                    | Insights (Markdown body, category, author, related locations)                                                                                                                     |
| `inquiries`                                               | `inquiry.ts`                    | Leads: type, status pipeline, assigned advisor, property snapshot, viewing slot, internal notes, consent, hashed IP                                                               |
| `site_settings`                                           | `site-settings.ts`              | Single document (`key: "global"`): contact, social, hero, about, testimonials, FAQs, announcement                                                                                 |
| `favorites`                                               | `user-data.ts`                  | Saved homes (`user` + `property`, unique)                                                                                                                                         |
| `saved_searches`                                          | `user-data.ts`                  | Saved searches as canonical query strings (unique per user)                                                                                                                       |
| `recent_views`                                            | `user-data.ts`                  | Recently viewed listings, expire after 90 days                                                                                                                                    |
| `audit_logs`                                              | `system.ts`                     | Administrative changes: actor, action, entity, summary, changed fields, hashed IP                                                                                                 |
| `rate_limits`                                             | `system.ts`                     | Fixed-window counters for app-level rate limits (TTL)                                                                                                                             |
| `daily_metrics`                                           | `system.ts`                     | Aggregated anonymous analytics per day/name/subject (TTL)                                                                                                                         |
| `user`, `account`, `session`, `verification`, `rateLimit` | Better Auth                     | Accounts (with `role`, `disabled`, `phone`), credentials, sessions, reset tokens, auth rate limits. `UserModel` is a read/admin view of `user`.                                   |

Collection names are explicit in the schemas; multi-word names use snake_case.

## Indexes

`npm run db:indexes` (`scripts/sync-indexes.ts`):

- syncs every index declared in the Mongoose schemas (and drops ones no longer declared);
- creates the indexes Better Auth declares, which its MongoDB adapter does **not** create:
  - unique `user.email` and `session.token`
  - `session.userId`, `account.userId` and `verification.identifier`
  - unique `rateLimit.key`
  - TTL clean-up of expired sessions and verification tokens

Production runs with `autoIndex` off, so run the script after every deployment that changes a
schema. Notable indexes:

- `properties`:
  - unique `slug`
  - compound indexes led by `status` for every public filter and sort
  - `2dsphere` on `location.geo`
  - weighted text index for keyword search
  - sparse `legacy.listingId` (used by the `/listing/<id>` redirect)
- `locations`: unique `{ parentSlug, slug }`.
- `favorites`, `saved_searches`, `recent_views`: unique per user and target, so writes are
  idempotent.
- TTL indexes: `recent_views.viewedAt` (90 days), `rate_limits.resetAt`,
  `daily_metrics.expiresAt`, `session.expiresAt` and `verification.expiresAt`.

## Data rules

- **Privacy.** `location.addressLine` is never mapped into public DTOs. Public coordinates are
  snapped to 0.01° unless `location.showExactLocation` is true. Enquiries store a salted hash of
  the IP, never the raw address.
- **Slugs** are unique, allocated with `-2`, `-3` suffixes, and never one of the reserved words
  (`map`, `new`, `admin`, …). A location's slug is locked once listings reference it, and
  renaming a location updates the denormalised names on its listings.
- **Deletes.**
  - Deleting a listing also removes favourites and recent views that point at it, then schedules
    removal of its media.
  - Archiving keeps the record.
  - Only administrators can delete listings permanently.

## Seed data (development and demos only)

`npm run db:seed` loads a clearly labelled **demonstration** catalogue:

- 13 locations
- 4 fictional advisors without photos
- 23 listings priced in BDT
- 6 articles
- site settings whose announcement says the content is sample data

Images are Unsplash photographs or the legacy app's own hero images.

- It refuses to run if listings already exist (`--reset` wipes the catalogue first, and only
  locally).
- It refuses non-local databases and `NODE_ENV=production` unless you pass `--allow-remote` and
  set `SEED_CONFIRM=demo-data`.
- Do not load it into a production database that will hold real listings.

## Legacy migration

`npm run db:migrate-legacy` (`scripts/migrate-legacy-data.ts`) copies users and listings from
the legacy app's MongoDB. The audit found no reachable legacy deployment, so this is only needed
if you still have the old database or a dump.

```bash
LEGACY_MONGODB_URI="mongodb://…/legacy-db" npm run db:migrate-legacy
```

The command above is a dry run that writes nothing and produces a report. To write:

```bash
LEGACY_MONGODB_URI="mongodb://…/legacy-db" npm run db:migrate-legacy -- --apply --default-city=dhaka
```

- **Read and write.** The legacy database is only read. The target is insert-only and the script
  is idempotent: existing emails and already-migrated listings are skipped.
- **Users** keep their bcrypt hash; sign-in verifies it with `bcryptjs`. Hashes corrupted by the
  legacy password-update bug are not copied, so those users reset their password. That needs
  email configured; see [ENVIRONMENT.md](ENVIRONMENT.md).
- **Listings** become **drafts** for review:
  - Offer pricing maps to price plus previous price.
  - Cloudinary images with known dimensions are referenced in place.
  - The city or neighbourhood is matched from the address text; listings that don't match are
    skipped unless `--default-city` is given.
  - Property type is set from `--property-type` (default `apartment`) because the legacy app
    never recorded it.
- **Remote targets** require `--allow-remote` and `MIGRATE_CONFIRM=<target database name>`.
- **Reports** go to `.data/migrations/` (git-ignored) and contain ids and reasons only.
- **Limitation:** images stay on the legacy Cloudinary account. If that account will be closed,
  re-upload the photos through the admin before closing it.

## Backups

Atlas backups (continuous cloud backup or snapshots) must be enabled on the production cluster.
The application does not take its own backups.
