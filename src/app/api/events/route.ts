import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getClientIp, hashIdentifier } from "@/lib/security/request";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { PropertyModel } from "@/server/models/property";
import { recordMetric } from "@/server/services/metrics";

const PUBLIC_EVENTS = [
  "property_view",
  "search",
  "share",
  "phone_click",
  "email_click",
  "whatsapp_click",
  "compare",
] as const;

const eventSchema = z.object({
  name: z.enum(PUBLIC_EVENTS),
  subject: z.string().max(100).regex(/^[a-z0-9-]*$/i).optional(),
});

/**
 * Anonymous, cookie-free event beacon. Only an allow-listed event name and an optional
 * listing id are accepted; nothing identifying the visitor is stored.
 */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 512) return new Response(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return new Response(null, { status: 400 });

  const limit = await consumeRateLimit(`event:${hashIdentifier(await getClientIp())}`, RATE_LIMITS.analytics);
  if (!limit.allowed) return new Response(null, { status: 204 });

  const { name, subject = "" } = parsed.data;
  await recordMetric(name, subject);
  if (name === "property_view" && Types.ObjectId.isValid(subject)) {
    await connectToDatabase();
    await PropertyModel.updateOne({ _id: subject, status: "published" }, { $inc: { viewCount: 1 } });
  }
  return new Response(null, { status: 204 });
}
