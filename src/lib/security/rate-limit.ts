import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RateLimitModel } from "@/server/models/system";

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitOutcome {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export const RATE_LIMITS = {
  inquiry: { limit: 5, windowSeconds: 60 * 10 },
  favorite: { limit: 60, windowSeconds: 60 },
  savedSearch: { limit: 20, windowSeconds: 60 * 10 },
  upload: { limit: 60, windowSeconds: 60 * 10 },
  analytics: { limit: 120, windowSeconds: 60 },
  accountUpdate: { limit: 10, windowSeconds: 60 * 10 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Fixed-window counter stored in MongoDB so limits hold across serverless instances.
 * Each window is a separate document keyed by its start time, so the increment is a single
 * atomic upsert and expired windows are reclaimed by a TTL index.
 */
export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<RateLimitOutcome> {
  await connectToDatabase();
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const resetAt = new Date(windowStart + windowMs);
  const id = `${key}:${windowStart}`;

  const increment = () =>
    RateLimitModel.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { resetAt } },
      { upsert: true, returnDocument: "after", lean: true },
    );

  let record;
  try {
    record = await increment();
  } catch (error) {
    // Two first requests in the same window can race on the upsert; the retry increments.
    if ((error as { code?: number }).code !== 11000) throw error;
    record = await increment();
  }

  const count = record?.count ?? 1;
  return { allowed: count <= rule.limit, remaining: Math.max(0, rule.limit - count), resetAt };
}
