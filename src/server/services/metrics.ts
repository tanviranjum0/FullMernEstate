import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DailyMetricModel } from "@/server/models/system";

export const METRIC_NAMES = [
  "property_view",
  "search",
  "favorite_add",
  "share",
  "inquiry",
  "viewing_request",
  "phone_click",
  "email_click",
  "whatsapp_click",
  "saved_search",
  "compare",
] as const;
export type MetricName = (typeof METRIC_NAMES)[number];

const RETENTION_DAYS = 400;

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Increments an anonymous daily counter. Failures are logged and never break the request. */
export async function recordMetric(name: MetricName, subject = ""): Promise<void> {
  try {
    await connectToDatabase();
    const day = utcDay();
    await DailyMetricModel.updateOne(
      { day, name, subject },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(Date.now() + RETENTION_DAYS * 86_400_000) },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("[metrics] failed to record", { name, error: (error as Error).message });
  }
}

export async function metricTotals(
  names: MetricName[],
  sinceDays: number,
): Promise<Record<string, number>> {
  await connectToDatabase();
  const since = utcDay(new Date(Date.now() - sinceDays * 86_400_000));
  const rows = await DailyMetricModel.aggregate<{ _id: string; total: number }>([
    { $match: { name: { $in: names }, day: { $gte: since } } },
    { $group: { _id: "$name", total: { $sum: "$count" } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.total]));
}

export async function metricSeries(
  name: MetricName,
  days: number,
): Promise<{ day: string; count: number }[]> {
  await connectToDatabase();
  const since = utcDay(new Date(Date.now() - (days - 1) * 86_400_000));
  const rows = await DailyMetricModel.aggregate<{ _id: string; count: number }>([
    { $match: { name, day: { $gte: since } } },
    { $group: { _id: "$day", count: { $sum: "$count" } } },
  ]);
  const byDay = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: days }, (_, index) => {
    const day = utcDay(new Date(Date.now() - (days - 1 - index) * 86_400_000));
    return { day, count: byDay.get(day) ?? 0 };
  });
}
