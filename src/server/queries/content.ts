import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { Types } from "mongoose";
import type { ArticleCategorySlug } from "@/config/domain";
import { connectToDatabase } from "@/lib/db/mongoose";
import { cacheTags } from "@/server/cache-tags";
import type {
  AgentCard,
  AgentDetail,
  ArticleCard,
  ArticleDetail,
  LocationDetail,
  LocationSummary,
  Paginated,
  SiteSettings,
} from "@/server/dto";
import {
  toAgentCard,
  toAgentDetail,
  toArticleCard,
  toArticleDetail,
  toLocationDetail,
  toLocationSummary,
  toSiteSettings,
} from "@/server/mappers";
import { AgentModel, type AgentRecord } from "@/server/models/agent";
import { ArticleModel, type ArticleRecord } from "@/server/models/article";
import { LocationModel, type LocationRecord } from "@/server/models/location";
import { SiteSettingsModel, type SiteSettingsRecord } from "@/server/models/site-settings";

/* ----------------------------------------------------------------------------------------------
 * Site settings
 * --------------------------------------------------------------------------------------------*/

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.settings);
  await connectToDatabase();
  const doc = await SiteSettingsModel.findOne({ key: "global" }).lean<SiteSettingsRecord>();
  return toSiteSettings(doc);
}

/* ----------------------------------------------------------------------------------------------
 * Locations
 * --------------------------------------------------------------------------------------------*/

export async function getCities(): Promise<LocationSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.locations);
  await connectToDatabase();
  const docs = await LocationModel.find({ kind: "city", published: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<LocationRecord[]>();
  return docs.map(toLocationSummary);
}

export async function getNeighbourhoods(citySlug?: string): Promise<LocationSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.locations);
  await connectToDatabase();
  const filter: Record<string, unknown> = { kind: "neighbourhood", published: true };
  if (citySlug) filter.parentSlug = citySlug;
  const docs = await LocationModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean<LocationRecord[]>();
  return docs.map(toLocationSummary);
}

export async function getLocation(citySlug: string, neighbourhoodSlug?: string): Promise<LocationDetail | null> {
  "use cache";
  cacheLife("hours");
  const path = neighbourhoodSlug ? `${citySlug}/${neighbourhoodSlug}` : citySlug;
  cacheTag(cacheTags.locations, cacheTags.location(path));
  await connectToDatabase();
  const doc = await LocationModel.findOne(
    neighbourhoodSlug
      ? { kind: "neighbourhood", parentSlug: citySlug, slug: neighbourhoodSlug, published: true }
      : { kind: "city", slug: citySlug, published: true },
  ).lean<LocationRecord>();
  return doc ? toLocationDetail(doc) : null;
}

/** All published locations, used for search facets and sitemaps. */
export async function getLocationTree(): Promise<{ city: LocationSummary; neighbourhoods: LocationSummary[] }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.locations);
  await connectToDatabase();
  const docs = await LocationModel.find({ published: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<LocationRecord[]>();
  const summaries = docs.map(toLocationSummary);
  return summaries
    .filter((loc) => loc.kind === "city")
    .map((city) => ({
      city,
      neighbourhoods: summaries.filter((loc) => loc.kind === "neighbourhood" && loc.parentSlug === city.slug),
    }));
}

/* ----------------------------------------------------------------------------------------------
 * Agents
 * --------------------------------------------------------------------------------------------*/

export async function getAgents(): Promise<AgentCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.agents);
  await connectToDatabase();
  const docs = await AgentModel.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean<AgentRecord[]>();
  return docs.map(toAgentCard);
}

export async function getAgentBySlug(slug: string): Promise<AgentDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.agents, cacheTags.agent(slug));
  await connectToDatabase();
  const doc = await AgentModel.findOne({ slug, active: true }).lean<AgentRecord>();
  return doc ? toAgentDetail(doc) : null;
}

export async function getAgentById(id: string): Promise<AgentDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.agents);
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await AgentModel.findOne({ _id: id, active: true }).lean<AgentRecord>();
  return doc ? toAgentDetail(doc) : null;
}

/* ----------------------------------------------------------------------------------------------
 * Articles
 * --------------------------------------------------------------------------------------------*/

const ARTICLE_PAGE_SIZE = 9;
const AUTHOR_POPULATE = { path: "author", select: "name slug", match: { active: true } } as const;

export async function getArticles({
  category,
  page = 1,
  q,
}: {
  category?: ArticleCategorySlug;
  page?: number;
  q?: string;
}): Promise<Paginated<ArticleCard>> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  await connectToDatabase();
  const filter: Record<string, unknown> = { status: "published" };
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };
  const [docs, total] = await Promise.all([
    ArticleModel.find(filter, q ? { score: { $meta: "textScore" }, body: 0 } : { body: 0 })
      .sort(q ? { score: { $meta: "textScore" } } : { publishedAt: -1 })
      .skip((page - 1) * ARTICLE_PAGE_SIZE)
      .limit(ARTICLE_PAGE_SIZE)
      .populate(AUTHOR_POPULATE)
      .lean<ArticleRecord[]>(),
    ArticleModel.countDocuments(filter),
  ]);
  return {
    items: docs.map(toArticleCard),
    total,
    page,
    pageSize: ARTICLE_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ARTICLE_PAGE_SIZE)),
  };
}

export async function getFeaturedArticles(limit = 3): Promise<ArticleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  await connectToDatabase();
  const docs = await ArticleModel.find({ status: "published" }, { body: 0 })
    .sort({ featured: -1, publishedAt: -1 })
    .limit(limit)
    .populate(AUTHOR_POPULATE)
    .lean<ArticleRecord[]>();
  return docs.map(toArticleCard);
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles, cacheTags.article(slug));
  await connectToDatabase();
  const doc = await ArticleModel.findOne({ slug, status: "published" })
    .populate(AUTHOR_POPULATE)
    .lean<ArticleRecord>();
  return doc ? toArticleDetail(doc) : null;
}

export async function getRelatedArticles(article: {
  id: string;
  category: string;
  relatedLocationSlugs: string[];
}): Promise<ArticleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  await connectToDatabase();
  const filter: Record<string, unknown> = {
    status: "published",
    _id: { $ne: new Types.ObjectId(article.id) },
    $or: [
      { category: article.category },
      ...(article.relatedLocationSlugs.length
        ? [{ relatedLocationSlugs: { $in: article.relatedLocationSlugs } }]
        : []),
    ],
  };
  const docs = await ArticleModel.find(filter, { body: 0 })
    .sort({ publishedAt: -1 })
    .limit(3)
    .populate(AUTHOR_POPULATE)
    .lean<ArticleRecord[]>();
  return docs.map(toArticleCard);
}

export async function getArticlesForLocation(locationSlug: string, limit = 3): Promise<ArticleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  await connectToDatabase();
  const docs = await ArticleModel.find({ status: "published", relatedLocationSlugs: locationSlug }, { body: 0 })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate(AUTHOR_POPULATE)
    .lean<ArticleRecord[]>();
  return docs.map(toArticleCard);
}

export async function getArticlesByAuthor(agentId: string, limit = 3): Promise<ArticleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  if (!Types.ObjectId.isValid(agentId)) return [];
  await connectToDatabase();
  const docs = await ArticleModel.find({ status: "published", author: agentId }, { body: 0 })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate(AUTHOR_POPULATE)
    .lean<ArticleRecord[]>();
  return docs.map(toArticleCard);
}

export async function getArticleSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.articles);
  await connectToDatabase();
  const rows = await ArticleModel.find({ status: "published" }, { slug: 1, updatedAt: 1 }).lean();
  return rows.map((row) => ({ slug: row.slug, updatedAt: new Date(row.updatedAt).toISOString() }));
}
