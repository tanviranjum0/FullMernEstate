import type { PropertySearchQuery } from "@/lib/search/params";

type Filter = Record<string, unknown>;
type Sort = Record<string, 1 | -1 | { $meta: "textScore" }>;

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Translates a validated search query into a MongoDB filter. Only typed primitives from
 * `parseSearchParams` reach this function, so no client-supplied object can become an operator.
 */
export function buildPropertyFilter(
  query: PropertySearchQuery,
  { keywordMode = "text" }: { keywordMode?: "text" | "regex" | "none" } = {},
): Filter {
  const and: Filter[] = [{ status: "published" }];

  if (query.listing) and.push({ listingType: query.listing });
  if (query.types.length) and.push({ propertyType: { $in: query.types } });
  if (query.city) {
    and.push({ "location.citySlug": query.city });
    if (query.neighbourhood) and.push({ "location.neighbourhoodSlug": query.neighbourhood });
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const range: Filter = {};
    if (query.minPrice !== undefined) range.$gte = query.minPrice;
    if (query.maxPrice !== undefined) range.$lte = query.maxPrice;
    // Price-on-request listings stay visible so a price filter cannot be used to infer them.
    and.push({ $or: [{ "price.amount": range }, { "price.onRequest": true }] });
  }

  if (query.beds) and.push({ "specs.bedrooms": { $gte: query.beds } });
  if (query.baths) and.push({ "specs.bathrooms": { $gte: query.baths } });

  if (query.minArea !== undefined || query.maxArea !== undefined) {
    const range: Filter = {};
    if (query.minArea !== undefined) range.$gte = query.minArea;
    if (query.maxArea !== undefined) range.$lte = query.maxArea;
    and.push({ "specs.areaSqft": range });
  }

  if (query.features.length) and.push({ amenities: { $all: query.features } });
  if (query.furnishing) and.push({ "specs.furnishing": query.furnishing });
  if (query.parking) and.push({ "specs.parkingSpaces": { $gte: 1 } });
  if (query.availability) and.push({ availability: query.availability });

  for (const flag of query.flags) {
    if (flag === "featured") and.push({ "flags.featured": true });
    if (flag === "exclusive") and.push({ "flags.exclusive": true });
    if (flag === "new-construction") and.push({ "flags.newConstruction": true });
    if (flag === "price-reduced") {
      and.push({ $expr: { $gt: [{ $ifNull: ["$price.previousAmount", 0] }, "$price.amount"] } });
    }
  }

  if (query.q && keywordMode === "text") {
    and.unshift({ $text: { $search: query.q } });
  } else if (query.q && keywordMode === "regex") {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    and.push({
      $or: [
        { title: pattern },
        { "location.cityName": pattern },
        { "location.neighbourhoodName": pattern },
        { "location.displayAddress": pattern },
      ],
    });
  }

  return and.length === 1 ? and[0]! : { $and: and };
}

export function buildPropertySort(query: PropertySearchQuery, usesText: boolean): Sort {
  if (usesText && query.sort === "newest") {
    return { score: { $meta: "textScore" }, publishedAt: -1, _id: -1 };
  }
  switch (query.sort) {
    case "price-asc":
      return { "price.amount": 1, _id: 1 };
    case "price-desc":
      return { "price.amount": -1, _id: -1 };
    case "area-desc":
      return { "specs.areaSqft": -1, _id: -1 };
    default:
      return { publishedAt: -1, _id: -1 };
  }
}
