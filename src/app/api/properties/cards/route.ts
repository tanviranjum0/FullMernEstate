import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import { getPropertiesByIds } from "@/server/queries/properties";

/** Public card data for up to 12 published listings (used by client-side "recently viewed"). */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => Types.ObjectId.isValid(id))
    .slice(0, 12);
  if (ids.length === 0) return Response.json([]);
  const cards = await getPropertiesByIds(ids);
  return Response.json(cards, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
