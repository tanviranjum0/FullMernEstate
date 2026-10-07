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

/** Serializable shapes that cross the server boundary. Raw documents never do. */

export interface MediaImage {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  blurDataURL: string;
}

export interface PropertyPrice {
  amount: number;
  currency: CurrencyCode;
  previousAmount: number | null;
  onRequest: boolean;
}

export interface PropertyCard {
  id: string;
  slug: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  availability: AvailabilityStatus;
  price: PropertyPrice;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number | null;
  location: {
    citySlug: string;
    cityName: string;
    neighbourhoodSlug: string;
    neighbourhoodName: string;
    displayAddress: string;
  };
  coordinates: { lat: number; lng: number } | null;
  flags: { featured: boolean; exclusive: boolean; newConstruction: boolean; priceReduced: boolean };
  image: MediaImage | null;
  secondaryImage: MediaImage | null;
  imageCount: number;
  publishedAt: string | null;
  isNew: boolean;
}

export interface FloorPlan {
  id: string;
  src: string;
  width: number;
  height: number;
  label: string;
  blurDataURL: string;
}

export interface PropertyDetail extends PropertyCard {
  headline: string;
  description: string;
  status: PublicationStatus;
  specs: {
    bedrooms: number;
    bathrooms: number;
    areaSqft: number | null;
    landAreaSqft: number | null;
    parkingSpaces: number;
    yearBuilt: number | null;
    floors: number | null;
    floorLevel: number | null;
    furnishing: Furnishing | null;
  };
  amenities: AmenityKey[];
  images: MediaImage[];
  floorPlans: FloorPlan[];
  videoUrl: string;
  virtualTour: { url: string; kind: VirtualTourKind } | null;
  showExactLocation: boolean;
  agentId: string | null;
  seo: { title: string; description: string };
  updatedAt: string;
  createdAt: string;
}

export interface AgentCard {
  id: string;
  slug: string;
  name: string;
  title: string;
  photo: MediaImage | null;
  email: string;
  phone: string;
  whatsapp: string;
  languages: string[];
  areas: string[];
}

export interface AgentDetail extends AgentCard {
  bio: string;
  specialties: string[];
  socials: { linkedin: string; instagram: string; website: string };
  seo: { title: string; description: string };
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface LocationSummary {
  id: string;
  kind: LocationKind;
  slug: string;
  parentSlug: string;
  name: string;
  headline: string;
  intro: string;
  heroImage: MediaImage | null;
  href: string;
}

export interface LocationDetail extends LocationSummary {
  body: string;
  highlights: { id: string; title: string; text: string }[];
  lifestyle: string[];
  nearby: string[];
  marketNotes: string;
  faqs: Faq[];
  center: { lat: number; lng: number } | null;
  zoom: number;
  seo: { title: string; description: string };
  updatedAt: string;
}

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategorySlug;
  coverImage: MediaImage | null;
  authorName: string;
  authorSlug: string | null;
  readingMinutes: number;
  publishedAt: string | null;
  featured: boolean;
}

export interface ArticleDetail extends ArticleCard {
  body: string;
  tags: string[];
  relatedLocationSlugs: string[];
  seo: { title: string; description: string };
  updatedAt: string;
}

export interface SiteSettings {
  contact: { email: string; phone: string; whatsapp: string; address: string; officeHours: string };
  social: { instagram: string; linkedin: string; facebook: string; youtube: string };
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    image: MediaImage | null;
    videoUrl: string;
  };
  about: { story: string; values: { id: string; title: string; text: string }[] };
  testimonials: { id: string; quote: string; author: string; context: string }[];
  faqs: Faq[];
  featuredPropertyIds: string[];
  announcement: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
