import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { FavoriteModel } from "@/server/models/user-data";

export async function getFavoriteIdsForUser(userId: string): Promise<string[]> {
  if (!Types.ObjectId.isValid(userId)) return [];
  await connectToDatabase();
  const rows = await FavoriteModel.find({ user: new Types.ObjectId(userId) }, { property: 1 })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return rows.map((row) => row.property.toString());
}
