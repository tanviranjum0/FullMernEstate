import { connectToDatabase } from "@/lib/db/mongoose";
import { PropertyModel } from "@/server/models/property";

/** Permanently redirects legacy `/listing/<ObjectId>` URLs to the migrated listing's slug. */
export async function GET(request: Request, context: RouteContext<"/listing/[id]">) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return new Response("Not found", { status: 404 });
  await connectToDatabase();
  const property = await PropertyModel.findOne({ "legacy.listingId": id, status: "published" }, { slug: 1 }).lean();
  const target = new URL(property ? `/properties/${property.slug}` : "/properties", request.url);
  return Response.redirect(target, property ? 308 : 307);
}
