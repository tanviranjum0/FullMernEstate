"use server";

import { Types } from "mongoose";
import { actionError, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { PropertyModel } from "@/server/models/property";
import { FavoriteModel } from "@/server/models/user-data";
import { recordMetric } from "@/server/services/metrics";

export async function toggleFavoriteAction(
  propertyId: unknown,
): Promise<ActionResult<{ favorited: boolean }>> {
  if (typeof propertyId !== "string" || !Types.ObjectId.isValid(propertyId)) {
    return actionError("That home could not be found.", "validation");
  }
  const user = await getCurrentUser();
  if (!user) return actionError("Please sign in to save homes.", "unauthenticated");

  const limit = await consumeRateLimit(`favorite:${user.id}`, RATE_LIMITS.favorite);
  if (!limit.allowed)
    return actionError("Too many changes in a short time. Please wait a moment.", "rate_limited");

  await connectToDatabase();
  const property = await PropertyModel.exists({ _id: propertyId, status: "published" });
  if (!property) return actionError("That home is no longer available.", "not_found");

  const filter = { user: new Types.ObjectId(user.id), property: new Types.ObjectId(propertyId) };
  const removed = await FavoriteModel.findOneAndDelete(filter).lean();
  if (removed) return { ok: true, data: { favorited: false } };

  try {
    await FavoriteModel.create(filter);
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  await recordMetric("favorite_add", propertyId);
  return { ok: true, data: { favorited: true } };
}
