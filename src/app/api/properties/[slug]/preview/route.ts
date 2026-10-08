import { isValidSlug } from "@/lib/slug";
import type { PropertyCard } from "@/server/dto";
import { getPropertyBySlug } from "@/server/queries/properties";

export interface PropertyPreview extends Pick<
  PropertyCard,
  | "id"
  | "slug"
  | "title"
  | "listingType"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "areaSqft"
  | "location"
> {
  headline: string;
  amenities: string[];
  images: { id: string; src: string; alt: string }[];
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/properties/[slug]/preview">,
) {
  const { slug } = await context.params;
  if (!isValidSlug(slug)) return Response.json({ error: "Not found" }, { status: 404 });

  const property = await getPropertyBySlug(slug);
  if (!property) return Response.json({ error: "Not found" }, { status: 404 });

  const preview: PropertyPreview = {
    id: property.id,
    slug: property.slug,
    title: property.title,
    listingType: property.listingType,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    location: property.location,
    headline: property.headline,
    amenities: property.amenities.slice(0, 8),
    images: property.images
      .slice(0, 6)
      .map((image) => ({ id: image.id, src: image.src, alt: image.alt })),
  };
  return Response.json(preview, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
