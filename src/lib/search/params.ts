import {
  AMENITY_KEYS,
  AVAILABILITY_STATUSES,
  FURNISHING_OPTIONS,
  LISTING_FLAGS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  type AmenityKey,
  type AvailabilityStatus,
  type Furnishing,
  type ListingFlag,
  type ListingType,
  type PropertyType,
  type SortOption,
} from "@/config/property-options";

export interface PropertySearchQuery {
  q?: string;
  listing?: ListingType;
  types: PropertyType[];
  city?: string;
  neighbourhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minArea?: number;
  maxArea?: number;
  features: AmenityKey[];
  furnishing?: Furnishing;
  parking: boolean;
  availability?: AvailabilityStatus;
  flags: ListingFlag[];
  sort: SortOption;
  page: number;
}

export const PAGE_SIZE = 12;
export const MAX_PAGE = 200;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function read(raw: RawParams, key: string): string | undefined {
  const value = raw instanceof URLSearchParams ? raw.get(key) : raw[key];
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}

function readList<T extends string>(raw: RawParams, key: string, allowed: readonly T[]): T[] {
  const value = read(raw, key);
  if (!value) return [];
  const set = new Set(allowed as readonly string[]);
  return [...new Set(value.split(",").map((part) => part.trim()))].filter((part): part is T =>
    set.has(part),
  );
}

function readEnum<T extends string>(
  raw: RawParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = read(raw, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function readInt(raw: RawParams, key: string, min: number, max: number): number | undefined {
  const value = read(raw, key);
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? parsed : undefined;
}

function readSlug(raw: RawParams, key: string): string | undefined {
  const value = read(raw, key)?.toLowerCase();
  return value && SLUG.test(value) && value.length <= 100 ? value : undefined;
}

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

/**
 * Parses untrusted URL parameters into a fully typed query. Invalid or out-of-range values
 * are dropped rather than rejected, so a malformed shared link still shows sensible results
 * and nothing that is not a primitive of a known shape ever reaches the database layer.
 */
export function parseSearchParams(raw: RawParams): PropertySearchQuery {
  const q = read(raw, "q")?.slice(0, 100);
  let minPrice = readInt(raw, "minPrice", 0, 1e13);
  let maxPrice = readInt(raw, "maxPrice", 0, 1e13);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  let minArea = readInt(raw, "minArea", 0, 5_000_000);
  let maxArea = readInt(raw, "maxArea", 0, 5_000_000);
  if (minArea !== undefined && maxArea !== undefined && minArea > maxArea) {
    [minArea, maxArea] = [maxArea, minArea];
  }

  return {
    q,
    listing: readEnum(raw, "listing", LISTING_TYPES),
    types: readList(raw, "type", PROPERTY_TYPES),
    city: readSlug(raw, "city"),
    neighbourhood: readSlug(raw, "neighbourhood"),
    minPrice,
    maxPrice,
    beds: readInt(raw, "beds", 1, 20),
    baths: readInt(raw, "baths", 1, 20),
    minArea,
    maxArea,
    features: readList(raw, "features", AMENITY_KEYS),
    furnishing: readEnum(raw, "furnishing", FURNISHING_OPTIONS),
    parking: read(raw, "parking") === "1",
    availability: readEnum(raw, "availability", AVAILABILITY_STATUSES),
    flags: readList(raw, "flags", LISTING_FLAGS),
    sort: readEnum(raw, "sort", SORT_VALUES) ?? "newest",
    page: readInt(raw, "page", 1, MAX_PAGE) ?? 1,
  };
}

/** Serialises a query in a stable key order so equivalent searches share one URL. */
export function serializeSearchQuery(
  query: Partial<PropertySearchQuery>,
  { includePage = true }: { includePage?: boolean } = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | undefined | false) => {
    if (value !== undefined && value !== false && value !== "") params.set(key, String(value));
  };
  set("q", query.q);
  set("listing", query.listing);
  if (query.types?.length) set("type", [...query.types].sort().join(","));
  set("city", query.city);
  set("neighbourhood", query.city ? query.neighbourhood : undefined);
  set("minPrice", query.minPrice);
  set("maxPrice", query.maxPrice);
  set("beds", query.beds);
  set("baths", query.baths);
  set("minArea", query.minArea);
  set("maxArea", query.maxArea);
  if (query.features?.length) set("features", [...query.features].sort().join(","));
  set("furnishing", query.furnishing);
  if (query.parking) set("parking", "1");
  set("availability", query.availability);
  if (query.flags?.length) set("flags", [...query.flags].sort().join(","));
  if (query.sort && query.sort !== "newest") set("sort", query.sort);
  if (includePage && query.page && query.page > 1) set("page", query.page);
  return params;
}

export function searchHref(query: Partial<PropertySearchQuery>, basePath = "/properties"): string {
  const params = serializeSearchQuery(query).toString();
  return params ? `${basePath}?${params}` : basePath;
}

export function countActiveFilters(query: PropertySearchQuery): number {
  return [
    query.listing,
    query.types.length > 0,
    query.city,
    query.minPrice !== undefined || query.maxPrice !== undefined,
    query.beds,
    query.baths,
    query.minArea !== undefined || query.maxArea !== undefined,
    query.features.length > 0,
    query.furnishing,
    query.parking,
    query.availability,
    query.flags.length > 0,
  ].filter(Boolean).length;
}

/**
 * Only the unfiltered catalogue and the buy/rent splits are indexable; every other filter
 * combination is `noindex, follow` and canonicalises to its indexable parent, so crawlers
 * index useful landing pages (plus location pages) instead of endless permutations.
 */
export function getSearchIndexability(query: PropertySearchQuery): {
  indexable: boolean;
  canonicalPath: string;
} {
  const base = query.listing ? `/properties?listing=${query.listing}` : "/properties";
  const onlyListing =
    !query.q &&
    query.types.length === 0 &&
    !query.city &&
    query.minPrice === undefined &&
    query.maxPrice === undefined &&
    !query.beds &&
    !query.baths &&
    query.minArea === undefined &&
    query.maxArea === undefined &&
    query.features.length === 0 &&
    !query.furnishing &&
    !query.parking &&
    !query.availability &&
    query.flags.length === 0 &&
    query.sort === "newest";

  if (!onlyListing) return { indexable: false, canonicalPath: base };
  if (query.page > 1) {
    const separator = base.includes("?") ? "&" : "?";
    return { indexable: true, canonicalPath: `${base}${separator}page=${query.page}` };
  }
  return { indexable: true, canonicalPath: base };
}
