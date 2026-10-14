# SEO

## What is in place

- **Server-rendered HTML for every public page.** Catalogue, guide, advisor and article pages are
  prerendered from cached data, with semantic landmarks, one `<h1>` per page and breadcrumbs.
- **Metadata per page** (`generateMetadata`):
  - title template `%s | <site name>`
  - descriptions written from listing facts (type, transaction, location, bedrooms, area, price)
    when no SEO override is set
  - Open Graph and Twitter cards with the listing's or guide's lead image (`ogImage()` falls back
    to `public/images/og-default.jpg`)

  Editors can override the SEO title and description for listings, guides, advisors and articles
  in the admin.

- **Canonical URLs** on every page, built from `NEXT_PUBLIC_SITE_URL`.
- **Search pages and crawl budget** (`getSearchIndexability`, unit-tested):
  - Only `/properties`, `/properties?listing=sale` and `/properties?listing=rent` (and their
    pagination) are indexable.
  - Every other filter combination is `noindex, follow` and canonicalises to its indexable
    parent.
  - Location guides (`/locations/<city>` and `/locations/<city>/<neighbourhood>`) are the
    indexable landing pages for place searches.
- **Status codes.** Unknown or unpublished listings, guides, advisors, articles and categories
  return HTTP **404** with `noindex` (verified by E2E tests against a production build; see
  ARCHITECTURE.md for why `partialPrefetching` is off). Legacy `/listing/<id>` URLs redirect
  permanently (308) to the migrated listing's slug, or temporarily (307) to `/properties` when
  there is no published match. Old `/search`, `/login` and `/create-listing` paths redirect to
  their new equivalents.
- **`/sitemap.xml`** lists static pages, the buy/rent splits, every published listing (with
  `lastModified`), published location guides, active advisors, article categories and published articles.
- **`/robots.txt`** disallows `/admin`, `/account`, `/api/`, `/compare`, `/properties/map`, the
  auth pages and `/media/`. On any non-production Vercel deployment it disallows everything, so
  previews are never indexed.
- **Structured data (JSON-LD):**
  - `WebSite` with `SearchAction` and `Organization` on the homepage
  - `BreadcrumbList` wherever breadcrumbs appear
  - `Article` for insights
  - `Person` for advisors
  - `FAQPage` where FAQs are shown

  Listings deliberately carry no listing-specific schema: Google offers no rich result for
  property listings, and fabricated `Offer`/`Product` markup could misrepresent availability.

- **Readable slugs** generated from titles (`/properties/gulshan-lakefront-penthouse`), unique
  and editable in the admin.
- **Images.** Responsive WebP variants with explicit dimensions (no layout shift). A listing
  cannot be published until every photograph has alt text.

## Things to know

- **Streamed metadata.** For browsers and JavaScript-rendering crawlers (including Googlebot),
  Next.js streams `<title>`/`<meta>` for request-time pages, so they arrive after `</head>`.
  Crawlers that don't run JavaScript (Bingbot, Facebook, Twitter/X, …) receive them inside
  `<head>`. This is Next.js's default behaviour (`htmlLimitedBots`). Lighthouse is treated as a
  browser, which is why it reports a missing description on `/properties`.
- **Demonstration content.** The seeded listings, advisors and articles are sample data, labelled
  by the site-wide announcement. Replace them with real content before asking search engines to
  index the production domain.
- **No invented claims.** Copy avoids unverifiable statistics, awards and testimonials;
  testimonials only appear when an editor publishes a real client quote.

## After launch

1. Choose the canonical hostname (for example, `https://www.example.com`) and set
   `NEXT_PUBLIC_SITE_URL` to that HTTPS origin without a path or trailing slash. It is inlined
   during the build, so redeploy after changing it. Production builds fail rather than emitting
   localhost or non-HTTPS canonical and sitemap URLs when no valid public origin is configured.
   Vercel uses `VERCEL_PROJECT_PRODUCTION_URL` as a fallback when the explicit setting is absent.
2. In your DNS provider, add the TXT record Google Search Console provides for a **Domain**
   property. DNS is managed outside this application. Wait for the record to propagate, then
   complete verification in Search Console. A Domain property covers both `www` and non-`www`
   hostnames and their subdomains; keep the application's canonical URL pointed at the one
   hostname you selected.
3. On the deployed production hostname, open `/robots.txt` and `/sitemap.xml`. Confirm robots
   allows public pages and references the sitemap, and that sitemap URLs use the chosen canonical
   hostname. Preview deployments intentionally disallow crawling.
4. In Search Console, open **Sitemaps** and submit `https://<canonical-hostname>/sitemap.xml`.
   Use **URL Inspection** on the homepage and representative public pages to confirm Google can
   fetch them and that their declared canonical matches the selected hostname.
5. Monitor the Page indexing and Sitemaps reports. Filtered searches and private/authentication
   pages are intentionally excluded; do not treat those exclusions as indexing failures.
6. Replace demonstration listings and other sample content before asking search engines to index
   the production site. Write location guides and insights for the neighbourhoods you actually
   serve; they are the main organic landing pages.
