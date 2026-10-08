"use server";

import { Types } from "mongoose";
import { actionError, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { PropertyModel } from "@/server/models/property";
import { FavoriteModel } from "@/server/models/user-data";
import { recordMetric } from "@/server/services/metrics";

/**
 * Saves or removes a home from the signed-in client's shortlist. The desired state is explicit
 * (not a toggle), so a repeated or early click can never flip it the wrong way.
 */
export async function setFavoriteAction(
  propertyId: unknown,
  favorite: unknown,
): Promise<ActionResult<{ favorited: boolean }>> {
  if (typeof propertyId !== "string" || !Types.ObjectId.isValid(propertyId)) {
    return actionError("That home could not be found.", "validation");
  }
  if (typeof favorite !== "boolean") return actionError("Invalid request.", "validation");
  const user = await getCurrentUser();
  if (!user) return actionError("Please sign in to save homes.", "unauthenticated");

  const limit = await consumeRateLimit(`favorite:${user.id}`, RATE_LIMITS.favorite);
  if (!limit.allowed)
    return actionError("Too many changes in a short time. Please wait a moment.", "rate_limited");

  await connectToDatabase();
  const filter = { user: new Types.ObjectId(user.id), property: new Types.ObjectId(propertyId) };

  // Removing is always allowed, so homes that were unpublished can still leave the shortlist.
  if (!favorite) {
    await FavoriteModel.deleteOne(filter);
    return { ok: true, data: { favorited: false } };
  }

  const property = await PropertyModel.exists({ _id: propertyId, status: "published" });
  if (!property) return actionError("That home is no longer available.", "not_found");
  const result = await FavoriteModel.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
  if (result.upsertedCount > 0) await recordMetric("favorite_add", propertyId);
  return { ok: true, data: { favorited: true } };
}
