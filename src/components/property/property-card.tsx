import Link from "next/link";
import { Camera } from "lucide-react";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from "@/config/property-options";
import { cn } from "@/lib/utils/cn";
import type { PropertyCard as PropertyCardData } from "@/server/dto";
import { CompareButton, FavoriteButton } from "./card-actions";
import { PriceTag, PropertyBadges, SpecsInline, locationLine } from "./property-meta";
import { QuickViewButton } from "./quick-view";

export function PropertyCard({
  property,
  priority = false,
  sizes = "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw",
  className,
  aspect = "aspect-[4/5]",
  headingLevel = "h3",
}: {
  property: PropertyCardData;
  priority?: boolean;
  sizes?: string;
  className?: string;
  aspect?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const href = `/properties/${property.slug}`;
  const muted = property.availability === "sold" || property.availability === "rented";
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className={cn("relative overflow-hidden bg-sand-100", aspect)}>
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 z-0">
          <ResponsiveImage
            image={property.image}
            sizes={sizes}
            priority={priority}
            alt=""
            className={cn(
              "transition-[transform,opacity,filter] duration-[1400ms] ease-luxe group-hover:scale-[1.04]",
              property.secondaryImage && "group-hover:opacity-0",
              muted && "grayscale-[35%]",
            )}
          />
          {property.secondaryImage ? (
            <ResponsiveImage
              image={property.secondaryImage}
              sizes={sizes}
              alt=""
              className="scale-[1.04] opacity-0 transition-[transform,opacity] duration-[1400ms] ease-luxe group-hover:scale-100 group-hover:opacity-100"
            />
          ) : null}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950/35 to-transparent opacity-80"
          />
        </Link>
        <PropertyBadges property={property} className="pointer-events-none absolute top-4 left-4 z-10" />
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <FavoriteButton propertyId={property.id} title={property.title} />
          <CompareButton propertyId={property.id} title={property.title} />
        </div>
        <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-10 flex items-end justify-between gap-3 text-ivory">
          <span className="text-[0.66rem] font-semibold tracking-[0.18em] uppercase">
            {LISTING_TYPE_LABELS[property.listingType]} · {PROPERTY_TYPE_LABELS[property.propertyType]}
          </span>
          {property.imageCount > 1 ? (
            <span className="flex items-center gap-1.5 text-xs tabular">
              <Camera aria-hidden strokeWidth={1.5} className="size-3.5" />
              <span className="sr-only">Photos:</span>
              {property.imageCount}
            </span>
          ) : null}
        </div>
        <QuickViewButton
          slug={property.slug}
          title={property.title}
          className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 lg:flex"
        />
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <p className="eyebrow text-stone-600">{locationLine(property)}</p>
        <Heading className="mt-2 font-display text-[1.6rem] leading-[1.15] text-ink-900">
          <Link
            href={href}
            className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-luxe group-hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px]"
          >
            {property.title}
          </Link>
        </Heading>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-4">
          <PriceTag price={property.price} listingType={property.listingType} />
          <SpecsInline bedrooms={property.bedrooms} bathrooms={property.bathrooms} areaSqft={property.areaSqft} />
        </div>
      </div>
    </article>
  );
}

export function PropertyGrid({
  properties,
  className,
  priorityCount = 0,
}: {
  properties: PropertyCardData[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <ul className={cn("grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {properties.map((property, index) => (
        <li key={property.id}>
          <PropertyCard property={property} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
