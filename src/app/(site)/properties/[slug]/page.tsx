import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/section";
import { ArrowUpRight, MapPin } from "lucide-react";
import { AgentContactCard } from "@/components/agents/agent-contact-card";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { RecentlyViewedStrip } from "@/components/home/recently-viewed";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LazyMap } from "@/components/maps/lazy-map";
import { CompareButton, FavoriteButton } from "@/components/property/card-actions";
import { PropertyGallery } from "@/components/property/gallery";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyCard } from "@/components/property/property-card";
import { PriceTag } from "@/components/property/property-meta";
import { RecordPropertyView } from "@/components/property/record-view";
import { ShareButton } from "@/components/property/share-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  AMENITY_CATALOG,
  AVAILABILITY_LABELS,
  FURNISHING_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/config/property-options";
import { siteConfig } from "@/config/site";
import { formatArea, formatNumber, formatPrice } from "@/lib/format";
import { toEmbed } from "@/lib/media/embed";
import { ogImage } from "@/lib/seo/url";
import type { PropertyDetail } from "@/server/dto";
import { getAgentById } from "@/server/queries/content";
import { getPropertyBySlug, getPublishedPropertySlugs, getSimilarProperties } from "@/server/queries/properties";

export async function generateStaticParams() {
  const slugs = await getPublishedPropertySlugs(40);
  // Cache Components requires at least one value; the placeholder renders a 404.
  return slugs.length ? slugs.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

function locationText(property: PropertyDetail) {
  const parts = [property.location.neighbourhoodName, property.location.cityName].filter(Boolean);
  return parts.join(", ");
}

function metaDescription(property: PropertyDetail) {
  if (property.seo.description) return property.seo.description;
  const facts = [
    property.bedrooms ? `${property.bedrooms} bedrooms` : null,
    property.areaSqft ? formatArea(property.areaSqft) : null,
  ].filter(Boolean);
  const price = property.price.onRequest
    ? "Price on request"
    : formatPrice(property.price.amount, property.price.currency, {
        compact: true,
        period: property.listingType === "rent" ? "month" : null,
      });
  return `${PROPERTY_TYPE_LABELS[property.propertyType]} ${LISTING_TYPE_LABELS[property.listingType].toLowerCase()} in ${locationText(property)}. ${facts.join(", ")}. ${price}. ${property.headline}`.slice(0, 160);
}

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Residence not found", robots: { index: false, follow: true } };
  const title = property.seo.title || `${property.title}, ${locationText(property)}`;
  const description = metaDescription(property);
  const images = ogImage(property.images[0]);
  return {
    title,
    description,
    alternates: { canonical: `/properties/${property.slug}` },
    openGraph: { type: "website", title, description, url: `/properties/${property.slug}`, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-sand-200 py-14 first:border-t-0 first:pt-0">
      <h2 id={id} className="font-display text-heading-2 text-ink-900">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyDetailView params={params} />
    </Suspense>
  );
}

function PropertySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading residence" className="container-page pt-6 pb-[var(--section-y)]">
      <Skeleton className="mb-6 h-3 w-64" />
      <Skeleton className="aspect-[4/3] w-full md:aspect-auto md:h-[min(72vh,44rem)]" />
      <div className="grid gap-x-16 pt-12 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-10 h-24 w-full" />
        </div>
        <Skeleton className="mt-10 h-[28rem] w-full lg:mt-0" />
      </div>
    </div>
  );
}

async function PropertyDetailView({ params }: { params: PageProps<"/properties/[slug]">["params"] }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [agent, similar] = await Promise.all([
    property.agentId ? getAgentById(property.agentId) : Promise.resolve(null),
    getSimilarProperties(property.id, 3),
  ]);

  const url = `${siteConfig.url}/properties/${property.slug}`;
  const paragraphs = property.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const amenityGroups = AMENITY_CATALOG.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => (property.amenities as string[]).includes(item.key)),
  })).filter((group) => group.items.length > 0);
  const tour = property.virtualTour ? toEmbed(property.virtualTour.url) : null;
  const video = property.videoUrl ? toEmbed(property.videoUrl) : null;
  const available = property.availability === "available" || property.availability === "under_offer";

  const specs: [string, string | null][] = [
    ["Property type", PROPERTY_TYPE_LABELS[property.propertyType]],
    ["Status", AVAILABILITY_LABELS[property.availability]],
    ["Interior area", property.specs.areaSqft ? formatArea(property.specs.areaSqft, siteConfig.areaUnit) : null],
    ["Land area", property.specs.landAreaSqft ? formatArea(property.specs.landAreaSqft, siteConfig.areaUnit) : null],
    ["Bedrooms", property.specs.bedrooms ? String(property.specs.bedrooms) : null],
    ["Bathrooms", property.specs.bathrooms ? String(property.specs.bathrooms) : null],
    ["Parking", property.specs.parkingSpaces ? `${property.specs.parkingSpaces} space${property.specs.parkingSpaces > 1 ? "s" : ""}` : null],
    ["Year built", property.specs.yearBuilt ? String(property.specs.yearBuilt) : null],
    ["Floors", property.specs.floors ? String(property.specs.floors) : null],
    ["Floor level", property.specs.floorLevel !== null ? String(property.specs.floorLevel) : null],
    ["Furnishing", property.specs.furnishing ? FURNISHING_LABELS[property.specs.furnishing] : null],
    ["Reference", property.id.slice(-6).toUpperCase()],
  ];

  const crumbs = [
    { label: "Properties", href: "/properties" },
    { label: property.location.cityName, href: `/locations/${property.location.citySlug}` },
    ...(property.location.neighbourhoodSlug
      ? [
          {
            label: property.location.neighbourhoodName,
            href: `/locations/${property.location.citySlug}/${property.location.neighbourhoodSlug}`,
          },
        ]
      : []),
    { label: property.title, href: `/properties/${property.slug}` },
  ];

  return (
    <article>
      <RecordPropertyView propertyId={property.id} />
      <div className="container-page pt-6">
        <Breadcrumbs items={crumbs} className="mb-6" />
        <PropertyGallery images={property.images} title={property.title} />
      </div>

      <div className="container-page grid gap-x-16 pt-12 pb-[var(--section-y)] lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="min-w-0">
          <header className="pb-12">
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow text-stone-600">
                {LISTING_TYPE_LABELS[property.listingType]} · {PROPERTY_TYPE_LABELS[property.propertyType]}
              </p>
              {property.availability !== "available" ? (
                <Badge tone="dark">{AVAILABILITY_LABELS[property.availability]}</Badge>
              ) : null}
              {property.flags.exclusive ? <Badge tone="bronze">Exclusive</Badge> : null}
              {property.flags.newConstruction ? <Badge tone="outline">New development</Badge> : null}
            </div>
            <h1 className="mt-4 font-display text-heading-1 text-ink-900">{property.title}</h1>
            <p className="mt-4 flex items-center gap-2 text-stone-600">
              <MapPin aria-hidden strokeWidth={1.5} className="size-4" />
              {property.location.displayAddress ? `${property.location.displayAddress} · ` : ""}
              {locationText(property)}
            </p>
            {property.headline ? <p className="mt-6 max-w-2xl text-lead text-stone-700">{property.headline}</p> : null}

            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-y border-sand-200 py-6">
              <div>
                <PriceTag price={property.price} listingType={property.listingType} className="[&>span:first-child]:text-[2rem]" />
                {!property.price.onRequest ? (
                  <p className="mt-1.5 text-xs text-stone-600 tabular">
                    {formatPrice(property.price.amount, property.price.currency, {
                      period: property.listingType === "rent" ? "month" : null,
                    })}
                  </p>
                ) : null}
              </div>
              <dl className="flex flex-wrap gap-x-8 gap-y-3">
                {[
                  ["Bedrooms", property.bedrooms ? String(property.bedrooms) : null],
                  ["Bathrooms", property.bathrooms ? String(property.bathrooms) : null],
                  ["Area", property.areaSqft ? `${formatNumber(property.areaSqft)} sq ft` : null],
                  ["Parking", property.specs.parkingSpaces ? String(property.specs.parkingSpaces) : null],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[0.66rem] font-semibold tracking-[0.16em] text-stone-600 uppercase">{label}</dt>
                      <dd className="mt-1 font-display text-2xl text-ink-900 tabular">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <FavoriteButton propertyId={property.id} title={property.title} variant="inline" />
              <CompareButton propertyId={property.id} title={property.title} variant="inline" />
              <ShareButton url={url} title={property.title} propertyId={property.id} />
            </div>
          </header>

          <Section id="about-heading" title="About this residence">
            <div className="max-w-3xl space-y-5 text-[1.05rem] leading-[1.8] text-ink-800">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className={index === 0 ? "text-lead text-ink-900" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
          </Section>

          <Section id="specs-heading" title="Specification">
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {specs
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-b border-sand-200 py-3.5">
                    <dt className="text-sm text-stone-600">{label}</dt>
                    <dd className="text-right font-medium text-ink-900 tabular">{value}</dd>
                  </div>
                ))}
            </dl>
          </Section>

          {amenityGroups.length ? (
            <Section id="features-heading" title="Features">
              <div className="grid gap-10 sm:grid-cols-2">
                {amenityGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="eyebrow text-stone-600">{group.label}</h3>
                    <ul className="mt-4 space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item.key} className="flex items-center gap-3 text-ink-800">
                          <span aria-hidden className="h-px w-4 bg-bronze-500" />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {property.floorPlans.length ? (
            <Section id="plans-heading" title="Floor plans">
              <div className="grid gap-6 sm:grid-cols-2">
                {property.floorPlans.map((plan) => (
                  <figure key={plan.id} className="bg-paper p-4">
                    <div className="relative aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- plans are line drawings shown at intrinsic size */}
                      <img src={plan.src} alt={plan.label || "Floor plan"} loading="lazy" className="absolute inset-0 size-full object-contain" />
                    </div>
                    {plan.label ? <figcaption className="mt-3 text-sm text-stone-600">{plan.label}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </Section>
          ) : null}

          {tour || video || property.virtualTour ? (
            <Section id="tour-heading" title={tour ? "Virtual tour" : "Video"}>
              {tour || video ? (
                <div className="relative aspect-video overflow-hidden bg-ink-950">
                  <iframe
                    src={(tour ?? video)!.src}
                    title={`${property.title} — ${tour ? "virtual tour" : "video"}`}
                    loading="lazy"
                    allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="absolute inset-0 size-full"
                  />
                </div>
              ) : property.virtualTour ? (
                <ButtonLink href={property.virtualTour.url} target="_blank" rel="noopener noreferrer" variant="outline">
                  Open virtual tour <ArrowUpRight strokeWidth={1.5} />
                </ButtonLink>
              ) : null}
            </Section>
          ) : null}

          {property.coordinates ? (
            <Section id="location-heading" title="Location">
              <LazyMap
                className="aspect-[16/10] w-full overflow-hidden bg-sand-100 sm:aspect-[16/8]"
                markers={[
                  {
                    id: property.id,
                    lat: property.coordinates.lat,
                    lng: property.coordinates.lng,
                    label: property.title,
                    title: property.title,
                  },
                ]}
                center={property.coordinates}
                zoom={property.showExactLocation ? 15 : 14}
                cluster={false}
                approximateRadiusMeters={property.showExactLocation ? undefined : 650}
                ariaLabel={`Map showing the ${property.showExactLocation ? "location" : "approximate area"} of ${property.title}`}
              />
              <p className="mt-4 text-sm text-stone-600">
                {property.showExactLocation
                  ? `${property.location.displayAddress}, ${locationText(property)}.`
                  : "To protect the owner's privacy the exact address is shared after an introductory conversation. The shaded area shows the approximate location."}{" "}
                <Link
                  href={
                    property.location.neighbourhoodSlug
                      ? `/locations/${property.location.citySlug}/${property.location.neighbourhoodSlug}`
                      : `/locations/${property.location.citySlug}`
                  }
                  className="text-ink-900 underline underline-offset-4"
                >
                  Discover {property.location.neighbourhoodName || property.location.cityName}
                </Link>
              </p>
            </Section>
          ) : null}

          {property.listingType === "sale" && !property.price.onRequest && available ? (
            <Section id="finance-heading" title="Finance estimate">
              <MortgageCalculator price={property.price.amount} currency={property.price.currency} />
            </Section>
          ) : null}
        </div>

        <aside id="enquire" className="scroll-mt-28 lg:pt-1" aria-label="Enquire about this residence">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <div className="bg-paper p-6 shadow-hairline sm:p-8">
              {agent ? (
                <div className="mb-8 border-b border-sand-200 pb-8">
                  <AgentContactCard agent={agent} propertyId={property.id} />
                </div>
              ) : null}
              <h2 className="font-display text-heading-3 text-ink-900">
                {available ? "Enquire about this residence" : "Interested in similar homes?"}
              </h2>
              <p className="mt-2 mb-6 text-sm text-stone-600">
                {available
                  ? "Ask a question or request a private viewing. We usually reply within one working day."
                  : "This home is no longer available, but our advisor can introduce comparable residences."}
              </p>
              <InquiryForm
                propertyId={property.id}
                propertyTitle={property.title}
                types={available ? ["property", "viewing"] : ["property"]}
                compact
              />
            </div>
          </div>
        </aside>
      </div>

      {similar.length ? (
        <section aria-labelledby="similar-heading" className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page">
            <h2 id="similar-heading" className="font-display text-heading-1 text-ink-900">
              Similar residences
            </h2>
            <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {similar.map((card) => (
                <li key={card.id}>
                  <PropertyCard property={card} aspect="aspect-[4/3]" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="pt-[var(--section-y)]">
        <RecentlyViewedStrip excludeId={property.id} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-sand-200 bg-ivory/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <PriceTag price={property.price} listingType={property.listingType} className="[&>span:first-child]:text-lg" showPrevious={false} />
        <ButtonLink href="#enquire" size="sm">
          Enquire
        </ButtonLink>
      </div>
    </article>
  );
}
