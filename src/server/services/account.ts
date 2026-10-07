import "server-only";
import { Types, type PipelineStage } from "mongoose";
import type { InquiryStatus, InquiryType } from "@/config/domain";
import { connectToDatabase } from "@/lib/db/mongoose";
import { describeSearch } from "@/lib/search/describe";
import { parseSearchParams } from "@/lib/search/params";
import type { PropertyCard } from "@/server/dto";
import { PROPERTY_CARD_STAGE, toPropertyCard } from "@/server/mappers";
import { InquiryModel } from "@/server/models/inquiry";
import { PropertyModel } from "@/server/models/property";
import { FavoriteModel, RecentViewModel, SavedSearchModel } from "@/server/models/user-data";
import { inquiryReference } from "./inquiries";

type CardRow = Parameters<typeof toPropertyCard>[0];

/** Every query here is scoped by the signed-in user's id, so one client never sees another's data. */
async function cardsInOrder(ids: Types.ObjectId[]): Promise<PropertyCard[]> {
  if (ids.length === 0) return [];
  const rows = await PropertyModel.aggregate<CardRow>([
    { $match: { _id: { $in: ids }, status: "published" } },
    PROPERTY_CARD_STAGE as unknown as PipelineStage,
  ]);
  const byId = new Map(rows.map((row) => [row._id.toString(), toPropertyCard(row)]));
  return ids.map((id) => byId.get(id.toString())).filter((card): card is PropertyCard => Boolean(card));
}

export async function getSavedProperties(userId: string, limit = 100): Promise<PropertyCard[]> {
  await connectToDatabase();
  const favorites = await FavoriteModel.find({ user: new Types.ObjectId(userId) }, { property: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return cardsInOrder(favorites.map((f) => f.property as Types.ObjectId));
}

export async function getRecentlyViewed(userId: string, limit = 8): Promise<PropertyCard[]> {
  await connectToDatabase();
  const views = await RecentViewModel.find({ user: new Types.ObjectId(userId) }, { property: 1 })
    .sort({ viewedAt: -1 })
    .limit(limit)
    .lean();
  return cardsInOrder(views.map((v) => v.property as Types.ObjectId));
}

export interface SavedSearchSummary {
  id: string;
  name: string;
  query: string;
  description: string;
  createdAt: string;
}

export async function getSavedSearches(userId: string, names: Record<string, string>): Promise<SavedSearchSummary[]> {
  await connectToDatabase();
  const rows = await SavedSearchModel.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    name: row.name,
    query: row.query,
    description: describeSearch(parseSearchParams(new URLSearchParams(row.query)), names),
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export interface UserInquirySummary {
  id: string;
  reference: string;
  type: InquiryType;
  status: InquiryStatus;
  propertyTitle: string;
  propertySlug: string;
  viewingDate: string | null;
  createdAt: string;
}

export async function getUserInquiries(userId: string, limit = 50): Promise<UserInquirySummary[]> {
  await connectToDatabase();
  const rows = await InquiryModel.find(
    { user: new Types.ObjectId(userId) },
    { type: 1, status: 1, propertySnapshot: 1, viewing: 1, createdAt: 1 },
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    reference: inquiryReference(row._id.toString()),
    type: row.type as InquiryType,
    status: row.status as InquiryStatus,
    propertyTitle: row.propertySnapshot?.title ?? "",
    propertySlug: row.propertySnapshot?.slug ?? "",
    viewingDate: row.viewing?.date ? new Date(row.viewing.date).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

export async function getAccountCounts(userId: string) {
  await connectToDatabase();
  const user = new Types.ObjectId(userId);
  const [saved, searches, inquiries] = await Promise.all([
    FavoriteModel.countDocuments({ user }),
    SavedSearchModel.countDocuments({ user }),
    InquiryModel.countDocuments({ user }),
  ]);
  return { saved, searches, inquiries };
}
