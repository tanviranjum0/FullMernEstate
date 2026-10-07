import {
  AMENITY_LABELS,
  AVAILABILITY_LABELS,
  FURNISHING_LABELS,
  LISTING_FLAG_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/config/property-options";
import { formatNumber, formatPrice } from "@/lib/format";
import type { PropertySearchQuery } from "./params";

export type LocationNames = Record<string, string>;

const pluralType: Record<string, string> = {
  apartment: "Apartments",
  penthouse: "Penthouses",
  duplex: "Duplexes",
  villa: "Villas",
  townhouse: "Townhouses",
  house: "Houses",
  land: "Land",
  commercial: "Commercial property",
};

function placeName(query: PropertySearchQuery, names: LocationNames): string | null {
  if (!query.city) return null;
  const city = names[query.city] ?? query.city;
  if (!query.neighbourhood) return city;
  return `${names[`${query.city}/${query.neighbourhood}`] ?? query.neighbourhood}, ${city}`;
}

/** Human-readable title for a search, e.g. "Penthouses for sale in Gulshan, Dhaka". */
export function describeSearch(query: PropertySearchQuery, names: LocationNames = {}): string {
  const subject =
    query.types.length === 1 ? pluralType[query.types[0]!] ?? "Homes" : query.types.length > 1 ? "Homes" : "Homes";
  const transaction = query.listing === "sale" ? " for sale" : query.listing === "rent" ? " to rent" : "";
  const place = placeName(query, names);
  const base = `${subject}${transaction}${place ? ` in ${place}` : ""}`;
  return query.q ? `“${query.q}” — ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
}

export interface FilterChip {
  key: string;
  label: string;
  without: Partial<PropertySearchQuery>;
}

/** Each chip carries the patch that removes it, so chips can be plain links. */
export function activeFilterChips(query: PropertySearchQuery, names: LocationNames, currency: string): FilterChip[] {
  const chips: FilterChip[] = [];
  const period = query.listing === "rent" ? ("month" as const) : null;
  if (query.q) chips.push({ key: "q", label: `“${query.q}”`, without: { q: undefined } });
  if (query.listing) {
    chips.push({ key: "listing", label: query.listing === "sale" ? "For sale" : "To rent", without: { listing: undefined } });
  }
  const place = placeName(query, names);
  if (place) chips.push({ key: "location", label: place, without: { city: undefined, neighbourhood: undefined } });
  for (const type of query.types) {
    chips.push({
      key: `type-${type}`,
      label: PROPERTY_TYPE_LABELS[type],
      without: { types: query.types.filter((t) => t !== type) },
    });
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const min = query.minPrice !== undefined ? formatPrice(query.minPrice, currency, { compact: true }) : null;
    const max = query.maxPrice !== undefined ? formatPrice(query.maxPrice, currency, { compact: true, period }) : null;
    chips.push({
      key: "price",
      label: min && max ? `${min} – ${max}` : min ? `From ${min}` : `Up to ${max}`,
      without: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (query.beds) chips.push({ key: "beds", label: `${query.beds}+ beds`, without: { beds: undefined } });
  if (query.baths) chips.push({ key: "baths", label: `${query.baths}+ baths`, without: { baths: undefined } });
  if (query.minArea !== undefined || query.maxArea !== undefined) {
    const label =
      query.minArea !== undefined && query.maxArea !== undefined
        ? `${formatNumber(query.minArea)}–${formatNumber(query.maxArea)} sq ft`
        : query.minArea !== undefined
          ? `From ${formatNumber(query.minArea)} sq ft`
          : `Up to ${formatNumber(query.maxArea!)} sq ft`;
    chips.push({ key: "area", label, without: { minArea: undefined, maxArea: undefined } });
  }
  for (const feature of query.features) {
    chips.push({
      key: `feature-${feature}`,
      label: AMENITY_LABELS[feature],
      without: { features: query.features.filter((f) => f !== feature) },
    });
  }
  if (query.furnishing) chips.push({ key: "furnishing", label: FURNISHING_LABELS[query.furnishing], without: { furnishing: undefined } });
  if (query.parking) chips.push({ key: "parking", label: "Parking", without: { parking: false } });
  if (query.availability) {
    chips.push({ key: "availability", label: AVAILABILITY_LABELS[query.availability], without: { availability: undefined } });
  }
  for (const flag of query.flags) {
    chips.push({ key: `flag-${flag}`, label: LISTING_FLAG_LABELS[flag], without: { flags: query.flags.filter((f) => f !== flag) } });
  }
  return chips;
}
