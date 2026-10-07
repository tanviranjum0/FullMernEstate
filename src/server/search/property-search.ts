import "server-only";
import type { PipelineStage } from "mongoose";
import { PAGE_SIZE, type PropertySearchQuery } from "@/lib/search/params";
import { connectToDatabase } from "@/lib/db/mongoose";
import type { Paginated, PropertyCard } from "@/server/dto";
import { PROPERTY_CARD_STAGE, toPropertyCard } from "@/server/mappers";
import { PropertyModel } from "@/server/models/property";
import { buildPropertyFilter, buildPropertySort } from "./property-filter";

export interface MapPoint {
  id: string;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  price: PropertyCard["price"];
  listingType: PropertyCard["listingType"];
  image: PropertyCard["image"];
  bedrooms: number;
  areaSqft: number | null;
}

/**
 * Search abstraction. The MongoDB implementation below is sufficient at catalogue sizes in the
 * low tens of thousands; a dedicated engine (Atlas Search, OpenSearch) can implement the same
 * interface without changes to pages or components.
 */
export interface PropertySearchEngine {
  search(query: PropertySearchQuery, pageSize?: number): Promise<Paginated<PropertyCard>>;
  mapPoints(query: PropertySearchQuery, limit?: number): Promise<MapPoint[]>;
}

type CardRow = Parameters<typeof toPropertyCard>[0];

async function runSearch(
  query: PropertySearchQuery,
  keywordMode: "text" | "regex" | "none",
  pageSize: number,
): Promise<Paginated<PropertyCard>> {
  const filter = buildPropertyFilter(query, { keywordMode });
  const usesText = keywordMode === "text" && Boolean(query.q);
  const sort = buildPropertySort(query, usesText);
  const skip = (query.page - 1) * pageSize;

  const pipeline: PipelineStage[] = [
    { $match: filter },
    ...(usesText ? [{ $addFields: { score: { $meta: "textScore" } } } as PipelineStage] : []),
    { $sort: sort as Record<string, 1 | -1 | { $meta: "textScore" }> },
    { $skip: skip },
    { $limit: pageSize },
    PROPERTY_CARD_STAGE as unknown as PipelineStage,
  ];

  const [rows, total] = await Promise.all([
    PropertyModel.aggregate<CardRow>(pipeline),
    PropertyModel.countDocuments(filter),
  ]);

  return {
    items: rows.map(toPropertyCard),
    total,
    page: query.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const mongoPropertySearch: PropertySearchEngine = {
  async search(query, pageSize = PAGE_SIZE) {
    await connectToDatabase();
    if (!query.q) return runSearch(query, "none", pageSize);
    const textResults = await runSearch(query, "text", pageSize);
    // Whole-word text search misses partial words ("gulsh"); fall back to a bounded,
    // escaped substring match on short fields when the text index finds nothing.
    if (textResults.total > 0 || query.q.length < 3) return textResults;
    return runSearch(query, "regex", pageSize);
  },

  async mapPoints(query, limit = 500) {
    await connectToDatabase();
    const filter = buildPropertyFilter(query, { keywordMode: query.q ? "regex" : "none" });
    const rows = await PropertyModel.aggregate<CardRow>([
      { $match: { $and: [filter, { "location.geo.coordinates.1": { $exists: true } }] } },
      { $sort: { publishedAt: -1 } },
      { $limit: limit },
      PROPERTY_CARD_STAGE as unknown as PipelineStage,
    ]);
    return rows
      .map(toPropertyCard)
      .filter((card) => card.coordinates)
      .map((card) => ({
        id: card.id,
        slug: card.slug,
        title: card.title,
        lat: card.coordinates!.lat,
        lng: card.coordinates!.lng,
        price: card.price,
        listingType: card.listingType,
        image: card.image,
        bedrooms: card.bedrooms,
        areaSqft: card.areaSqft,
      }));
  },
};
