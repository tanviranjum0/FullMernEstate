import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check, Minus, Scale } from "lucide-react";
import { PageIntro } from "@/components/layout/page-intro";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { CompareFromStorage, RemoveFromCompare } from "@/components/property/compare-controls";
import { PriceTag } from "@/components/property/property-meta";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/section";
import {
  AMENITY_ITEMS,
  AVAILABILITY_LABELS,
  FURNISHING_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/config/property-options";
import { formatArea, formatPrice } from "@/lib/format";
import type { PropertyDetail } from "@/server/dto";
import { getPropertyDetailsByIds } from "@/server/queries/properties";

export const metadata: Metadata = {
  title: "Compare residences",
  description: "Compare price, size, specification and features side by side.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/compare" },
};

type Row = { label: string; value: (p: PropertyDetail) => React.ReactNode };

const rows: Row[] = [
  { label: "Transaction", value: (p) => LISTING_TYPE_LABELS[p.listingType] },
  { label: "Type", value: (p) => PROPERTY_TYPE_LABELS[p.propertyType] },
  {
    label: "Location",
    value: (p) => [p.location.neighbourhoodName, p.location.cityName].filter(Boolean).join(", "),
  },
  { label: "Status", value: (p) => AVAILABILITY_LABELS[p.availability] },
  { label: "Bedrooms", value: (p) => p.specs.bedrooms || "—" },
  { label: "Bathrooms", value: (p) => p.specs.bathrooms || "—" },
  { label: "Interior area", value: (p) => (p.specs.areaSqft ? formatArea(p.specs.areaSqft) : "—") },
  {
    label: "Price per sq ft",
    value: (p) =>
      p.specs.areaSqft && !p.price.onRequest
        ? formatPrice(Math.round(p.price.amount / p.specs.areaSqft), p.price.currency, {
            period: p.listingType === "rent" ? "month" : null,
          })
        : "—",
  },
  {
    label: "Land area",
    value: (p) => (p.specs.landAreaSqft ? formatArea(p.specs.landAreaSqft) : "—"),
  },
  { label: "Parking", value: (p) => p.specs.parkingSpaces || "—" },
  { label: "Year built", value: (p) => p.specs.yearBuilt ?? "—" },
  {
    label: "Furnishing",
    value: (p) => (p.specs.furnishing ? FURNISHING_LABELS[p.specs.furnishing] : "—"),
  },
];

async function Comparison({
  searchParams,
}: {
  searchParams: PageProps<"/compare">["searchParams"];
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.ids) ? params.ids[0] : params.ids;
  const ids = (raw ?? "")
    .split(",")
    .filter((id) => /^[a-f0-9]{24}$/i.test(id))
    .slice(0, 4);
  const properties = await getPropertyDetailsByIds(ids);

  if (properties.length === 0) {
    return (
      <div className="container-page pb-[var(--section-y)]">
        <CompareFromStorage hasIds={ids.length > 0} />
        <EmptyState
          icon={<Scale strokeWidth={1.25} />}
          title="Nothing to compare yet"
          description="Use the compare button on any residence to add up to four homes, then return here to see them side by side."
          action={<ButtonLink href="/properties">Browse residences</ButtonLink>}
        />
      </div>
    );
  }

  const amenityRows = AMENITY_ITEMS.filter((item) =>
    properties.some((p) => p.amenities.includes(item.key)),
  );
  return (
    <div className="container-page pb-[var(--section-y)]">
      <div
        className="overflow-x-auto pb-4"
        role="region"
        aria-label="Comparison table"
        tabIndex={0}
      >
        <table className="w-full min-w-max border-collapse text-left">
          <caption className="sr-only">
            Side-by-side comparison of {properties.length} residences
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-48 bg-ivory align-bottom" />
              {properties.map((property) => (
                <th
                  key={property.id}
                  scope="col"
                  className="min-w-56 px-3 pb-6 align-top font-normal"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                    <ResponsiveImage image={property.image} sizes="280px" alt="" />
                    <div className="absolute top-2 right-2">
                      <RemoveFromCompare
                        propertyId={property.id}
                        title={property.title}
                        remainingIds={properties
                          .filter((p) => p.id !== property.id)
                          .map((p) => p.id)}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="mt-4 block font-display text-xl leading-tight text-ink-900 hover:text-harbour-700"
                  >
                    {property.title}
                  </Link>
                  <PriceTag
                    price={property.price}
                    listingType={property.listingType}
                    className="mt-2"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-sand-200">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-ivory py-3.5 pr-4 text-sm font-normal text-stone-600"
                >
                  {row.label}
                </th>
                {properties.map((property) => (
                  <td key={property.id} className="tabular px-3 py-3.5 text-ink-900">
                    {row.value(property)}
                  </td>
                ))}
              </tr>
            ))}
            {amenityRows.length ? (
              <tr className="border-t border-ink-900">
                <th
                  scope="rowgroup"
                  colSpan={properties.length + 1}
                  className="sticky left-0 bg-ivory pt-8 pb-3 text-left"
                >
                  <span className="eyebrow text-stone-600">Features</span>
                </th>
              </tr>
            ) : null}
            {amenityRows.map((amenity) => (
              <tr key={amenity.key} className="border-t border-sand-200">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-ivory py-3 pr-4 text-sm font-normal text-stone-600"
                >
                  {amenity.label}
                </th>
                {properties.map((property) => (
                  <td key={property.id} className="px-3 py-3">
                    {property.amenities.includes(amenity.key) ? (
                      <Check
                        aria-label="Yes"
                        strokeWidth={1.5}
                        className="size-5 text-success-600"
                      />
                    ) : (
                      <Minus aria-label="No" strokeWidth={1.5} className="size-5 text-stone-400" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Compare", href: "/compare" }]}
        eyebrow="Shortlist"
        title="Compare residences"
        lead="Price, space, specification and features, side by side."
      />
      <Suspense
        fallback={
          <div className="container-page">
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <Comparison searchParams={searchParams} />
      </Suspense>
    </>
  );
}
