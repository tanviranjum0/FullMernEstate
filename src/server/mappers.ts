import "server-only";
import type {
  AmenityKey,
  AvailabilityStatus,
  CurrencyCode,
  Furnishing,
  ListingType,
  PropertyType,
  PublicationStatus,
  VirtualTourKind,
} from "@/config/property-options";
import type { ArticleCategorySlug, LocationKind } from "@/config/domain";
import type {
  AgentCard,
  AgentDetail,
  ArticleCard,
  ArticleDetail,
  LocationDetail,
  LocationSummary,
  MediaImage,
  PropertyCard,
  PropertyDetail,
  SiteSettings,
} from "./dto";
import type { AgentRecord } from "./models/agent";
import type { ArticleRecord } from "./models/article";
import type { LocationRecord } from "./models/location";
import type { PropertyRecord } from "./models/property";
import type { SiteSettingsRecord } from "./models/site-settings";

const NEW_LISTING_DAYS = 21;

interface RawImage {
  _id?: { toString(): string } | null;
  src?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  caption?: string | null;
  blurDataURL?: string | null;
}

export function toMediaImage(image: RawImage | null | undefined, fallbackAlt = ""): MediaImage | null {
  if (!image?.src || !image.width || !image.height) return null;
  return {
    id: image._id?.toString() ?? image.src,
    src: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt || fallbackAlt,
    caption: image.caption ?? "",
    blurDataURL: image.blurDataURL ?? "",
  };
}

const iso = (value: Date | null | undefined) => (value ? new Date(value).toISOString() : null);

type PropertyCardSource = Pick<
  PropertyRecord,
  | "_id"
  | "slug"
  | "title"
  | "listingType"
  | "propertyType"
  | "availability"
  | "price"
  | "specs"
  | "location"
  | "flags"
  | "images"
  | "publishedAt"
>;

/** Aggregation `$project` stage for card-sized property payloads. */
export const PROPERTY_CARD_STAGE = {
  $project: {
    slug: 1,
    title: 1,
    listingType: 1,
    propertyType: 1,
    availability: 1,
    price: 1,
    "specs.bedrooms": 1,
    "specs.bathrooms": 1,
    "specs.areaSqft": 1,
    "location.citySlug": 1,
    "location.cityName": 1,
    "location.neighbourhoodSlug": 1,
    "location.neighbourhoodName": 1,
    "location.displayAddress": 1,
    "location.geo": 1,
    "location.showExactLocation": 1,
    flags: 1,
    images: { $slice: [{ $ifNull: ["$images", []] }, 2] },
    imageCount: { $size: { $ifNull: ["$images", []] } },
    publishedAt: 1,
  },
} as const;

/**
 * Exact coordinates are only exposed when the listing allows it; otherwise they are snapped to
 * a ~1 km grid so maps show the neighbourhood without revealing the address.
 */
function coordinatesOf(location: PropertyRecord["location"] | undefined) {
  const coords = location?.geo?.coordinates;
  if (!coords || coords.length !== 2) return null;
  const [lng, lat] = coords as [number, number];
  if (location?.showExactLocation) return { lat, lng };
  const snap = (value: number) => Math.round(value * 100) / 100;
  return { lat: snap(lat), lng: snap(lng) };
}

export function toPropertyCard(doc: PropertyCardSource & { imageCount?: number }): PropertyCard {
  const previous = doc.price?.previousAmount ?? null;
  const amount = doc.price?.amount ?? 0;
  const title = doc.title;
  const publishedAt = doc.publishedAt ? new Date(doc.publishedAt) : null;
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title,
    listingType: doc.listingType as ListingType,
    propertyType: doc.propertyType as PropertyType,
    availability: doc.availability as AvailabilityStatus,
    price: {
      amount,
      currency: (doc.price?.currency ?? "BDT") as CurrencyCode,
      previousAmount: previous,
      onRequest: Boolean(doc.price?.onRequest),
    },
    bedrooms: doc.specs?.bedrooms ?? 0,
    bathrooms: doc.specs?.bathrooms ?? 0,
    areaSqft: doc.specs?.areaSqft ?? null,
    location: {
      citySlug: doc.location?.citySlug ?? "",
      cityName: doc.location?.cityName ?? "",
      neighbourhoodSlug: doc.location?.neighbourhoodSlug ?? "",
      neighbourhoodName: doc.location?.neighbourhoodName ?? "",
      displayAddress: doc.location?.displayAddress ?? "",
    },
    coordinates: coordinatesOf(doc.location),
    flags: {
      featured: Boolean(doc.flags?.featured),
      exclusive: Boolean(doc.flags?.exclusive),
      newConstruction: Boolean(doc.flags?.newConstruction),
      priceReduced: previous !== null && previous > amount,
    },
    image: toMediaImage(doc.images?.[0], title),
    secondaryImage: toMediaImage(doc.images?.[1], title),
    imageCount: doc.imageCount ?? doc.images?.length ?? 0,
    publishedAt: iso(publishedAt),
    isNew: publishedAt ? Date.now() - publishedAt.getTime() < NEW_LISTING_DAYS * 86_400_000 : false,
  };
}

export function toPropertyDetail(doc: PropertyRecord): PropertyDetail {
  const card = toPropertyCard({ ...doc, imageCount: doc.images?.length ?? 0 });
  const tour = doc.virtualTour?.url
    ? { url: doc.virtualTour.url, kind: (doc.virtualTour.kind ?? "external") as VirtualTourKind }
    : null;
  return {
    ...card,
    coordinates: card.coordinates,
    headline: doc.headline ?? "",
    description: doc.description,
    status: doc.status as PublicationStatus,
    specs: {
      bedrooms: doc.specs?.bedrooms ?? 0,
      bathrooms: doc.specs?.bathrooms ?? 0,
      areaSqft: doc.specs?.areaSqft ?? null,
      landAreaSqft: doc.specs?.landAreaSqft ?? null,
      parkingSpaces: doc.specs?.parkingSpaces ?? 0,
      yearBuilt: doc.specs?.yearBuilt ?? null,
      floors: doc.specs?.floors ?? null,
      floorLevel: doc.specs?.floorLevel ?? null,
      furnishing: (doc.specs?.furnishing as Furnishing | undefined) ?? null,
    },
    amenities: (doc.amenities ?? []) as AmenityKey[],
    images: (doc.images ?? [])
      .map((image, index) => toMediaImage(image, `${doc.title} — image ${index + 1}`))
      .filter((image): image is MediaImage => image !== null),
    floorPlans: (doc.floorPlans ?? []).map((plan) => ({
      id: plan._id?.toString() ?? plan.src,
      src: plan.src,
      width: plan.width,
      height: plan.height,
      label: plan.label ?? "",
      blurDataURL: plan.blurDataURL ?? "",
    })),
    videoUrl: doc.video?.url ?? "",
    virtualTour: tour,
    showExactLocation: Boolean(doc.location?.showExactLocation),
    agentId: doc.agent?.toString() ?? null,
    seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    updatedAt: new Date(doc.updatedAt).toISOString(),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function toAgentCard(doc: AgentRecord): AgentCard {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    title: doc.title ?? "",
    photo: toMediaImage(doc.photo, doc.name),
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    whatsapp: doc.whatsapp ?? "",
    languages: doc.languages ?? [],
    areas: doc.areas ?? [],
  };
}

export function toAgentDetail(doc: AgentRecord): AgentDetail {
  return {
    ...toAgentCard(doc),
    bio: doc.bio ?? "",
    specialties: doc.specialties ?? [],
    socials: {
      linkedin: doc.socials?.linkedin ?? "",
      instagram: doc.socials?.instagram ?? "",
      website: doc.socials?.website ?? "",
    },
    seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
  };
}

export function locationHref(kind: LocationKind, slug: string, parentSlug: string): string {
  return kind === "city" ? `/locations/${slug}` : `/locations/${parentSlug}/${slug}`;
}

export function toLocationSummary(doc: LocationRecord): LocationSummary {
  const kind = doc.kind as LocationKind;
  return {
    id: doc._id.toString(),
    kind,
    slug: doc.slug,
    parentSlug: doc.parentSlug ?? "",
    name: doc.name,
    headline: doc.headline ?? "",
    intro: doc.intro ?? "",
    heroImage: toMediaImage(doc.heroImage, doc.name),
    href: locationHref(kind, doc.slug, doc.parentSlug ?? ""),
  };
}

export function toLocationDetail(doc: LocationRecord): LocationDetail {
  const center =
    doc.center?.lat !== undefined && doc.center?.lng !== undefined && doc.center.lat !== null
      ? { lat: doc.center.lat, lng: doc.center.lng as number }
      : null;
  return {
    ...toLocationSummary(doc),
    body: doc.body ?? "",
    highlights: (doc.highlights ?? []).map((h) => ({ id: h._id.toString(), title: h.title, text: h.text })),
    lifestyle: doc.lifestyle ?? [],
    nearby: doc.nearby ?? [],
    marketNotes: doc.marketNotes ?? "",
    faqs: (doc.faqs ?? []).map((f) => ({ id: f._id.toString(), question: f.question, answer: f.answer })),
    center,
    zoom: doc.zoom ?? 12,
    seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

type ArticleWithAuthor = ArticleRecord & { author?: unknown };

function authorOf(doc: ArticleWithAuthor): { name: string; slug: string | null } {
  const author = doc.author as { name?: string; slug?: string } | null | undefined;
  if (author && typeof author === "object" && "name" in author && author.name) {
    return { name: author.name, slug: author.slug ?? null };
  }
  return { name: doc.authorName || "Editorial team", slug: null };
}

export function toArticleCard(doc: ArticleWithAuthor): ArticleCard {
  const author = authorOf(doc);
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? "",
    category: doc.category as ArticleCategorySlug,
    coverImage: toMediaImage(doc.coverImage, doc.title),
    authorName: author.name,
    authorSlug: author.slug,
    readingMinutes: doc.readingMinutes ?? 1,
    publishedAt: iso(doc.publishedAt),
    featured: Boolean(doc.featured),
  };
}

export function toArticleDetail(doc: ArticleWithAuthor): ArticleDetail {
  return {
    ...toArticleCard(doc),
    body: doc.body,
    tags: doc.tags ?? [],
    relatedLocationSlugs: doc.relatedLocationSlugs ?? [],
    seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export const EMPTY_SITE_SETTINGS: SiteSettings = {
  contact: { email: "", phone: "", whatsapp: "", address: "", officeHours: "" },
  social: { instagram: "", linkedin: "", facebook: "", youtube: "" },
  hero: { eyebrow: "", headline: "", subheadline: "", image: null, videoUrl: "" },
  about: { story: "", values: [] },
  testimonials: [],
  faqs: [],
  featuredPropertyIds: [],
  announcement: "",
};

export function toSiteSettings(doc: SiteSettingsRecord | null): SiteSettings {
  if (!doc) return EMPTY_SITE_SETTINGS;
  return {
    contact: {
      email: doc.contact?.email ?? "",
      phone: doc.contact?.phone ?? "",
      whatsapp: doc.contact?.whatsapp ?? "",
      address: doc.contact?.address ?? "",
      officeHours: doc.contact?.officeHours ?? "",
    },
    social: {
      instagram: doc.social?.instagram ?? "",
      linkedin: doc.social?.linkedin ?? "",
      facebook: doc.social?.facebook ?? "",
      youtube: doc.social?.youtube ?? "",
    },
    hero: {
      eyebrow: doc.hero?.eyebrow ?? "",
      headline: doc.hero?.headline ?? "",
      subheadline: doc.hero?.subheadline ?? "",
      image: toMediaImage(doc.hero?.image, "Featured residence"),
      videoUrl: doc.hero?.videoUrl ?? "",
    },
    about: {
      story: doc.about?.story ?? "",
      values: (doc.about?.values ?? []).map((v) => ({ id: v._id.toString(), title: v.title, text: v.text })),
    },
    testimonials: (doc.testimonials ?? [])
      .filter((t) => t.published)
      .map((t) => ({ id: t._id.toString(), quote: t.quote, author: t.author, context: t.context ?? "" })),
    faqs: (doc.faqs ?? []).map((f) => ({ id: f._id.toString(), question: f.question, answer: f.answer })),
    featuredPropertyIds: (doc.featuredPropertyIds ?? []).map((id) => id.toString()),
    announcement: doc.announcement ?? "",
  };
}
