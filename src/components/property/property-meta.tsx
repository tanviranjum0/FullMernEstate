import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS } from "@/config/property-options";
import { siteConfig } from "@/config/site";
import { formatArea, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { PropertyCard } from "@/server/dto";

export function PriceTag({
  price,
  listingType,
  compact = true,
  className,
  showPrevious = true,
}: {
  price: PropertyCard["price"];
  listingType: PropertyCard["listingType"];
  compact?: boolean;
  className?: string;
  showPrevious?: boolean;
}) {
  if (price.onRequest) {
    return (
      <p className={cn("font-display text-[1.35rem] text-ink-900", className)}>Price on request</p>
    );
  }
  const period = listingType === "rent" ? "month" : null;
  const reduced =
    showPrevious && price.previousAmount !== null && price.previousAmount > price.amount;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className="tabular font-display text-[1.35rem] leading-none text-ink-900">
        {formatPrice(price.amount, price.currency, { compact, period })}
      </span>
      {reduced ? (
        <span className="tabular text-sm text-stone-500 line-through decoration-stone-400">
          <span className="sr-only">Previously </span>
          {formatPrice(price.previousAmount!, price.currency, { compact })}
        </span>
      ) : null}
    </p>
  );
}

export function PropertyBadges({
  property,
  className,
}: {
  property: PropertyCard;
  className?: string;
}) {
  const badges: { label: string; tone: "light" | "dark" | "bronze" | "harbour" }[] = [];
  if (property.availability !== "available") {
    badges.push({ label: AVAILABILITY_LABELS[property.availability], tone: "dark" });
  }
  if (property.flags.exclusive) badges.push({ label: "Exclusive", tone: "bronze" });
  if (property.flags.newConstruction) badges.push({ label: "New development", tone: "light" });
  else if (property.isNew && property.availability === "available")
    badges.push({ label: "Just listed", tone: "light" });
  if (property.flags.priceReduced && property.availability === "available")
    badges.push({ label: "Price reduced", tone: "harbour" });
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.slice(0, 2).map((badge) => (
        <Badge key={badge.label} tone={badge.tone}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

export function SpecsInline({
  bedrooms,
  bathrooms,
  areaSqft,
  className,
}: {
  bedrooms: number;
  bathrooms: number;
  areaSqft: number | null;
  className?: string;
}) {
  const parts = [
    bedrooms > 0 ? `${bedrooms} bed${bedrooms === 1 ? "" : "s"}` : null,
    bathrooms > 0 ? `${bathrooms} bath${bathrooms === 1 ? "" : "s"}` : null,
    areaSqft ? formatArea(areaSqft, siteConfig.areaUnit) : null,
  ].filter(Boolean);
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-x-3 text-[0.82rem] text-stone-600", className)}
    >
      {parts.map((part, index) => (
        <li key={part} className="tabular flex items-center gap-3">
          {index > 0 ? <span aria-hidden className="size-0.5 rounded-full bg-stone-400" /> : null}
          {part}
        </li>
      ))}
    </ul>
  );
}

export function locationLine(property: Pick<PropertyCard, "location">): string {
  const { neighbourhoodName, cityName } = property.location;
  return neighbourhoodName ? `${neighbourhoodName}, ${cityName}` : cityName;
}
