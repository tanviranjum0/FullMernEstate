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

1. Set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy (canonicals and the sitemap are
   built from it).
2. Verify the domain in Google Search Console and Bing Webmaster Tools, then submit
   `https://<domain>/sitemap.xml`.
3. Use Search Console's Page indexing report to confirm filtered search URLs are excluded as
   intended ("Excluded by 'noindex' tag").
4. Write location guides and insights for the neighbourhoods you actually serve; they are the
   main organic landing pages.
