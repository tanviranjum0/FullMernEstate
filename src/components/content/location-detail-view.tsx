import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/content/article-card";
import { LocationCard } from "@/components/content/location-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LazyMap } from "@/components/maps/lazy-map";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { Reveal } from "@/components/motion/motion";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/section";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/config/property-options";
import { formatPrice } from "@/lib/format";
import { parseSearchParams, searchHref } from "@/lib/search/params";
import { renderMarkdown } from "@/lib/security/markdown";
import type { LocationDetail, LocationSummary } from "@/server/dto";
import { getArticlesForLocation } from "@/server/queries/content";
import {
  getLocationMarketStats,
  getMapPoints,
  getPropertiesInLocation,
} from "@/server/queries/properties";

export async function LocationDetailView({
  location,
  city,
  neighbourhoods,
}: {
  location: LocationDetail;
  city: LocationSummary | null;
  neighbourhoods: LocationSummary[];
}) {
  const citySlug = location.kind === "city" ? location.slug : location.parentSlug;
  const neighbourhoodSlug = location.kind === "neighbourhood" ? location.slug : null;
  const query = parseSearchParams({
    city: citySlug,
    neighbourhood: neighbourhoodSlug ?? undefined,
  });

  const [properties, stats, articles, points] = await Promise.all([
    getPropertiesInLocation(citySlug, neighbourhoodSlug, 6),
    getLocationMarketStats(citySlug, neighbourhoodSlug),
    getArticlesForLocation(location.slug, 3),
    getMapPoints(query),
  ]);

  const crumbs = [
    { label: "Locations", href: "/locations" },
    ...(city && location.kind === "neighbourhood" ? [{ label: city.name, href: city.href }] : []),
    { label: location.name, href: location.href },
  ];
  const searchLink = searchHref(query);

  return (
    <>
      <section className="relative isolate -mt-px flex min-h-[70svh] items-end overflow-hidden bg-ink-950 text-ivory">
        <ResponsiveImage
          image={location.heroImage}
          sizes="100vw"
          priority
          className="-z-10 opacity-85"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-ink-950/20"
        />
        <div className="container-page pt-24 pb-14 sm:pb-20">
          <Breadcrumbs items={crumbs} tone="light" />
          <Eyebrow className="mt-10 text-ivory/75">
            {location.kind === "city" ? "City guide" : `${city?.name ?? ""} neighbourhood guide`}
          </Eyebrow>
          <h1 className="mt-5 font-display text-display-1 text-ivory">{location.name}</h1>
          {location.headline ? (
            <p className="mt-5 max-w-2xl text-lead text-ivory/85">{location.headline}</p>
          ) : null}
        </div>
      </section>

      <section className="container-page section-y grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {location.intro ? (
            <p className="font-display text-[1.75rem] leading-snug text-ink-900">
              {location.intro}
            </p>
          ) : null}
          {location.body ? (
            <div
              className="prose-editorial mt-10"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(location.body) }}
            />
          ) : null}
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="bg-paper p-7 shadow-hairline">
            <h2 className="eyebrow text-stone-600">On the market here</h2>
            <dl className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <dt className="text-xs text-stone-600">For sale</dt>
                <dd className="tabular mt-1 font-display text-3xl text-ink-900">{stats.forSale}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">To rent</dt>
                <dd className="tabular mt-1 font-display text-3xl text-ink-900">{stats.forRent}</dd>
              </div>
              {stats.medianSalePrice && stats.currency ? (
                <div className="col-span-2">
                  <dt className="text-xs text-stone-600">Median asking price (sale)</dt>
                  <dd className="tabular mt-1 font-display text-2xl text-ink-900">
                    {formatPrice(stats.medianSalePrice, stats.currency, { compact: true })}
                  </dd>
                </div>
              ) : null}
              {stats.medianRent && stats.currency ? (
                <div className="col-span-2">
                  <dt className="text-xs text-stone-600">Median asking rent</dt>
                  <dd className="tabular mt-1 font-display text-2xl text-ink-900">
                    {formatPrice(stats.medianRent, stats.currency, {
                      compact: true,
                      period: "month",
                    })}
                  </dd>
                </div>
              ) : null}
            </dl>
            {stats.byType.length ? (
              <ul className="mt-6 space-y-1.5 border-t border-sand-200 pt-5 text-sm text-stone-700">
                {stats.byType.map((row) => (
                  <li key={row.propertyType} className="flex justify-between">
                    <span>
                      {PROPERTY_TYPE_LABELS[row.propertyType as PropertyType] ?? row.propertyType}
                    </span>
                    <span className="tabular">{row.count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-6 text-xs leading-relaxed text-stone-600">
              Based on residences currently listed on this site — an indication of our portfolio,
              not of all market transactions.
            </p>
            <ButtonLink href={searchLink} className="mt-6 w-full">
              Browse {stats.total} {stats.total === 1 ? "residence" : "residences"}
            </ButtonLink>
          </div>
          {location.highlights.length ? (
            <ul className="mt-10 space-y-6">
              {location.highlights.map((highlight) => (
                <li key={highlight.id} className="border-l border-bronze-500 pl-5">
                  <h3 className="font-display text-xl text-ink-900">{highlight.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{highlight.text}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </section>

      {properties.length ? (
        <section aria-labelledby="loc-homes" className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page">
            <SectionHeading
              eyebrow="Residences"
              title={<span id="loc-homes">Homes in {location.name}</span>}
              action={
                <ButtonLink href={searchLink} variant="link">
                  See all <ArrowRight strokeWidth={1.5} />
                </ButtonLink>
              }
            />
            <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <li key={property.id}>
                  <PropertyCard property={property} aspect="aspect-[4/3]" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {neighbourhoods.length ? (
        <section aria-labelledby="loc-neighbourhoods" className="container-page section-y">
          <SectionHeading
            eyebrow="Neighbourhoods"
            title={<span id="loc-neighbourhoods">Explore {location.name}</span>}
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {neighbourhoods.map((n) => (
              <li key={n.id}>
                <LocationCard location={n} aspect="aspect-[4/3]" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {points.length && location.center ? (
        <section aria-labelledby="loc-map" className="container-page pb-[var(--section-y)]">
          <h2 id="loc-map" className="font-display text-heading-2 text-ink-900">
            On the map
          </h2>
          <LazyMap
            className="mt-8 aspect-[4/3] w-full overflow-hidden bg-sand-100 sm:aspect-[16/7]"
            markers={points.map((point) => ({
              id: point.id,
              lat: point.lat,
              lng: point.lng,
              title: point.title,
              label: point.price.onRequest
                ? "POA"
                : formatPrice(point.price.amount, point.price.currency, { compact: true }).replace(
                    "BDT ",
                    "৳",
                  ),
            }))}
            center={location.center}
            zoom={location.zoom}
            ariaLabel={`Map of residences in ${location.name}`}
          />
          <p className="mt-3 text-sm text-stone-600">
            Locations are approximate unless the owner has chosen to show the exact address.{" "}
            <Link
              href={searchHref(query, "/properties/map")}
              className="text-ink-900 underline underline-offset-4"
            >
              Open the full map
            </Link>
          </p>
        </section>
      ) : null}

      {location.lifestyle.length || location.nearby.length ? (
        <section className="container-page grid gap-12 border-t border-sand-200 py-[var(--section-y)] md:grid-cols-2">
          {location.lifestyle.length ? (
            <div>
              <h2 className="eyebrow text-stone-600">Lifestyle</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {location.lifestyle.map((item) => (
                  <li
                    key={item}
                    className="rounded-xs border border-sand-300 px-3 py-1.5 text-sm text-ink-800"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {location.nearby.length ? (
            <div>
              <h2 className="eyebrow text-stone-600">Nearby</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {location.nearby.map((item) => (
                  <li
                    key={item}
                    className="rounded-xs border border-sand-300 px-3 py-1.5 text-sm text-ink-800"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {location.faqs.length ? (
        <section aria-labelledby="loc-faq" className="container-page pb-[var(--section-y)]">
          <h2 id="loc-faq" className="font-display text-heading-2 text-ink-900">
            Questions about {location.name}
          </h2>
          <div className="mt-8 max-w-3xl divide-y divide-sand-200 border-y border-sand-200">
            {location.faqs.map((faq) => (
              <details key={faq.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl text-ink-900 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden
                    className="text-2xl text-stone-500 transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-stone-700">{faq.answer}</p>
              </details>
            ))}
          </div>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: location.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            }}
          />
        </section>
      ) : null}

      {articles.length ? (
        <section aria-labelledby="loc-insights" className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page">
            <SectionHeading
              eyebrow="Insights"
              title={<span id="loc-insights">Reading about {location.name}</span>}
            />
            <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="bg-harbour-900 text-ivory">
        <Reveal className="container-page flex flex-col gap-8 py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-heading-1">Looking in {location.name}?</h2>
            <p className="mt-4 text-lead text-ivory/80">
              Our advisors know the streets, the buildings and the homes that never reach the open
              market.
            </p>
          </div>
          <ButtonLink href="/contact?type=consultation" variant="light" size="lg">
            Speak with an advisor
          </ButtonLink>
        </Reveal>
      </section>
    </>
  );
}
