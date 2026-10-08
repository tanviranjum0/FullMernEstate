"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionError, type ActionResult } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { parseSearchParams, serializeSearchQuery } from "@/lib/search/params";
import { SavedSearchModel } from "@/server/models/user-data";
import { recordMetric } from "@/server/services/metrics";

const MAX_SAVED_SEARCHES = 25;

const saveSchema = z.object({
  query: z.string().max(2000),
  name: z.string().trim().min(2, "Give this search a name").max(120),
});

export async function saveSearchAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return actionError("Please sign in to save searches.", "unauthenticated");

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success)
    return actionError(parsed.error.issues[0]?.message ?? "Invalid search", "validation");

  const limit = await consumeRateLimit(`saved-search:${user.id}`, RATE_LIMITS.savedSearch);
  if (!limit.allowed)
    return actionError("Too many saved searches in a short time.", "rate_limited");

  // Re-canonicalise on the server so stored queries only ever contain validated parameters.
  const canonical = serializeSearchQuery(
    parseSearchParams(new URLSearchParams(parsed.data.query)),
    {
      includePage: false,
    },
  ).toString();

  await connectToDatabase();
  const userId = new Types.ObjectId(user.id);
  const count = await SavedSearchModel.countDocuments({ user: userId });
  const existing = await SavedSearchModel.findOne(
    { user: userId, query: canonical },
    { _id: 1 },
  ).lean();
  if (existing)
    return {
      ok: true,
      data: { id: existing._id.toString() },
      message: "This search is already saved.",
    };
  if (count >= MAX_SAVED_SEARCHES) {
    return actionError(
      `You can keep up to ${MAX_SAVED_SEARCHES} saved searches. Remove one to add another.`,
      "conflict",
    );
  }

  const created = await SavedSearchModel.create({
    user: userId,
    name: parsed.data.name,
    query: canonical,
  });
  await recordMetric("saved_search");
  revalidatePath("/account/searches");
  return { ok: true, data: { id: created._id.toString() }, message: "Search saved." };
}

export async function deleteSavedSearchAction(id: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return actionError("Please sign in.", "unauthenticated");
  if (typeof id !== "string" || !Types.ObjectId.isValid(id))
    return actionError("Not found.", "not_found");
  await connectToDatabase();
  // Scoped by owner, so one user can never delete another user's saved search.
  const result = await SavedSearchModel.deleteOne({ _id: id, user: new Types.ObjectId(user.id) });
  if (result.deletedCount === 0) return actionError("Not found.", "not_found");
  revalidatePath("/account/searches");
  return { ok: true, data: undefined };
}
