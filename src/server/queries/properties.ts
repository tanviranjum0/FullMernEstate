import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Types, type PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { rankSimilar, type RecommendationSubject } from "@/lib/recommendations";
import type { PropertySearchQuery } from "@/lib/search/params";
import { cacheTags } from "@/server/cache-tags";
import type { Paginated, PropertyCard, PropertyDetail } from "@/server/dto";
import { PROPERTY_CARD_STAGE, toPropertyCard, toPropertyDetail } from "@/server/mappers";
import { PropertyModel, type PropertyRecord } from "@/server/models/property";
import { mongoPropertySearch, type MapPoint } from "@/server/search/property-search";

type CardRow = Parameters<typeof toPropertyCard>[0];

async function cards(match: Record<string, unknown>, sort: Record<string, 1 | -1>, limit: number) {
  await connectToDatabase();
  const rows = await PropertyModel.aggregate<CardRow>([
    { $match: { status: "published", ...match } },
    { $sort: sort },
    { $limit: limit },
    PROPERTY_CARD_STAGE as unknown as PipelineStage,
  ]);
  return rows.map(toPropertyCard);
}

export async function getFeaturedProperties(limit = 6): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  const featured = await cards({ "flags.featured": true }, { publishedAt: -1 }, limit);
  if (featured.length >= limit) return featured;
  const filler = await cards(
    { _id: { $nin: featured.map((card) => new Types.ObjectId(card.id)) } },
    { publishedAt: -1 },
    limit - featured.length,
  );
  return [...featured, ...filler];
}

export async function getLatestProperties(limit = 8): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  return cards({}, { publishedAt: -1 }, limit);
}

export async function getExclusiveProperties(limit = 4): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  return cards({ "flags.exclusive": true }, { publishedAt: -1 }, limit);
}

export async function searchProperties(query: PropertySearchQuery): Promise<Paginated<PropertyCard>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.properties);
  return mongoPropertySearch.search(query);
}

export async function getMapPoints(query: PropertySearchQuery): Promise<MapPoint[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.properties);
  return mongoPropertySearch.mapPoints(query);
}

export async function getPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties, cacheTags.property(slug));
  await connectToDatabase();
  const doc = await PropertyModel.findOne({ slug, status: "published" }).lean<PropertyRecord>();
  return doc ? toPropertyDetail(doc) : null;
}

export async function getPublishedPropertySlugs(limit = 5000): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  await connectToDatabase();
  const rows = await PropertyModel.find({ status: "published" }, { slug: 1, updatedAt: 1 })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((row) => ({ slug: row.slug, updatedAt: new Date(row.updatedAt).toISOString() }));
}

export async function getPropertiesByIds(ids: string[]): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.properties);
  const valid = ids.filter((id) => Types.ObjectId.isValid(id)).slice(0, 50);
  if (valid.length === 0) return [];
  const found = await cards(
    { _id: { $in: valid.map((id) => new Types.ObjectId(id)) } },
    { publishedAt: -1 },
    valid.length,
  );
  const byId = new Map(found.map((card) => [card.id, card]));
  return valid.map((id) => byId.get(id)).filter((card): card is PropertyCard => Boolean(card));
}

export async function getPropertyDetailsByIds(ids: string[]): Promise<PropertyDetail[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.properties);
  const valid = ids.filter((id) => Types.ObjectId.isValid(id)).slice(0, 4);
  if (valid.length === 0) return [];
  await connectToDatabase();
  const docs = await PropertyModel.find({
    _id: { $in: valid.map((id) => new Types.ObjectId(id)) },
    status: "published",
  }).lean<PropertyRecord[]>();
  const byId = new Map(docs.map((doc) => [doc._id.toString(), toPropertyDetail(doc)]));
  return valid.map((id) => byId.get(id)).filter((d): d is PropertyDetail => Boolean(d));
}

export async function getPropertiesByAgent(agentId: string, limit = 12): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  if (!Types.ObjectId.isValid(agentId)) return [];
  return cards({ agent: new Types.ObjectId(agentId) }, { publishedAt: -1 }, limit);
}

export async function getPropertiesInLocation(
  citySlug: string,
  neighbourhoodSlug: string | null,
  limit = 6,
): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  const match: Record<string, unknown> = { "location.citySlug": citySlug };
  if (neighbourhoodSlug) match["location.neighbourhoodSlug"] = neighbourhoodSlug;
  return cards(match, { "flags.featured": -1, publishedAt: -1 }, limit);
}

export async function getPropertyCountsByLocation(): Promise<Record<string, number>> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  await connectToDatabase();
  const rows = await PropertyModel.aggregate<{ _id: { city: string; hood: string }; count: number }>([
    { $match: { status: "published" } },
    {
      $group: {
        _id: { city: "$location.citySlug", hood: "$location.neighbourhoodSlug" },
        count: { $sum: 1 },
      },
    },
  ]);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row._id.city] = (counts[row._id.city] ?? 0) + row.count;
    if (row._id.hood) counts[`${row._id.city}/${row._id.hood}`] = row.count;
  }
  return counts;
}

export interface LocationMarketStats {
  total: number;
  forSale: number;
  forRent: number;
  medianSalePrice: number | null;
  medianRent: number | null;
  currency: string | null;
  byType: { propertyType: string; count: number }[];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** Market figures computed from live, published listings only — never hand-entered claims. */
export async function getLocationMarketStats(
  citySlug: string,
  neighbourhoodSlug: string | null,
): Promise<LocationMarketStats> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  await connectToDatabase();
  const match: Record<string, unknown> = { status: "published", "location.citySlug": citySlug };
  if (neighbourhoodSlug) match["location.neighbourhoodSlug"] = neighbourhoodSlug;
  const rows = await PropertyModel.find(match, {
    listingType: 1,
    propertyType: 1,
    "price.amount": 1,
    "price.currency": 1,
    "price.onRequest": 1,
  }).lean<
    {
      listingType: string;
      propertyType: string;
      price?: { amount?: number; currency?: string; onRequest?: boolean };
    }[]
  >();

  const currencies = new Set(rows.map((row) => row.price?.currency));
  const singleCurrency = currencies.size === 1 ? [...currencies][0] ?? null : null;
  const priced = (type: string) =>
    rows
      .filter((row) => row.listingType === type && !row.price?.onRequest)
      .map((row) => row.price?.amount ?? 0)
      .filter((amount) => amount > 0);

  const typeCounts = new Map<string, number>();
  for (const row of rows) typeCounts.set(row.propertyType, (typeCounts.get(row.propertyType) ?? 0) + 1);

  return {
    total: rows.length,
    forSale: rows.filter((row) => row.listingType === "sale").length,
    forRent: rows.filter((row) => row.listingType === "rent").length,
    medianSalePrice: singleCurrency ? median(priced("sale")) : null,
    medianRent: singleCurrency ? median(priced("rent")) : null,
    currency: singleCurrency,
    byType: [...typeCounts.entries()]
      .map(([propertyType, count]) => ({ propertyType, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getSimilarProperties(propertyId: string, limit = 4): Promise<PropertyCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.properties);
  if (!Types.ObjectId.isValid(propertyId)) return [];
  await connectToDatabase();
  const base = await PropertyModel.findById(propertyId).lean<PropertyRecord>();
  if (!base) return [];

  const price = base.price?.amount ?? 0;
  const candidates = await PropertyModel.find(
    {
      _id: { $ne: base._id },
      status: "published",
      listingType: base.listingType,
      $or: [
        { "location.citySlug": base.location?.citySlug },
        { propertyType: base.propertyType },
        ...(price > 0 ? [{ "price.amount": { $gte: price * 0.6, $lte: price * 1.4 } }] : []),
      ],
    },
    { _id: 1 },
  )
    .limit(60)
    .lean();
  if (candidates.length === 0) return [];

  const docs = await PropertyModel.aggregate<CardRow & { amenities: string[] }>([
    { $match: { _id: { $in: candidates.map((c) => c._id) } } },
    {
      $project: {
        ...(PROPERTY_CARD_STAGE.$project as Record<string, unknown>),
        amenities: 1,
      },
    },
  ]);

  const toSubject = (doc: {
    _id: Types.ObjectId;
    listingType?: string | null;
    propertyType?: string | null;
    location?: { citySlug?: string | null; neighbourhoodSlug?: string | null } | null;
    price?: { amount?: number | null } | null;
    specs?: { bedrooms?: number | null; areaSqft?: number | null } | null;
    amenities?: readonly string[] | null;
  }): RecommendationSubject => ({
    id: doc._id.toString(),
    listingType: doc.listingType ?? "",
    propertyType: doc.propertyType ?? "",
    citySlug: doc.location?.citySlug ?? "",
    neighbourhoodSlug: doc.location?.neighbourhoodSlug ?? "",
    price: doc.price?.amount ?? 0,
    bedrooms: doc.specs?.bedrooms ?? 0,
    areaSqft: doc.specs?.areaSqft ?? null,
    amenities: doc.amenities ?? [],
  });

  const baseSubject = toSubject(base);
  const ranked = rankSimilar(
    baseSubject,
    docs.map((doc) => ({ ...toSubject(doc), doc })),
    limit,
  );
  return ranked.map((entry) => toPropertyCard(entry.doc));
}
