export const LISTING_TYPES = ["sale", "rent"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];
export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: "For sale",
  rent: "To rent",
};

export const PROPERTY_TYPES = [
  "apartment",
  "penthouse",
  "duplex",
  "villa",
  "townhouse",
  "house",
  "land",
  "commercial",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  penthouse: "Penthouse",
  duplex: "Duplex",
  villa: "Villa",
  townhouse: "Townhouse",
  house: "House",
  land: "Land",
  commercial: "Commercial",
};

export const AVAILABILITY_STATUSES = ["available", "under_offer", "sold", "rented"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  under_offer: "Under offer",
  sold: "Sold",
  rented: "Let",
};

export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export const PUBLICATION_LABELS: Record<PublicationStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const FURNISHING_OPTIONS = ["furnished", "semi_furnished", "unfurnished"] as const;
export type Furnishing = (typeof FURNISHING_OPTIONS)[number];
export const FURNISHING_LABELS: Record<Furnishing, string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
};

export const AMENITY_CATALOG = [
  {
    category: "outdoor",
    label: "Outdoor living",
    items: [
      { key: "pool", label: "Swimming pool" },
      { key: "garden", label: "Private garden" },
      { key: "terrace", label: "Terrace" },
      { key: "balcony", label: "Balcony" },
      { key: "rooftop", label: "Rooftop access" },
      { key: "outdoor_kitchen", label: "Outdoor kitchen" },
    ],
  },
  {
    category: "setting",
    label: "Setting & views",
    items: [
      { key: "waterfront", label: "Waterfront" },
      { key: "sea_view", label: "Sea view" },
      { key: "lake_view", label: "Lake view" },
      { key: "city_view", label: "City view" },
      { key: "park_view", label: "Park view" },
    ],
  },
  {
    category: "wellness",
    label: "Wellness & leisure",
    items: [
      { key: "gym", label: "Private gym" },
      { key: "spa", label: "Spa" },
      { key: "sauna", label: "Sauna" },
      { key: "home_cinema", label: "Home cinema" },
      { key: "wine_cellar", label: "Wine cellar" },
      { key: "games_room", label: "Games room" },
    ],
  },
  {
    category: "interiors",
    label: "Interiors",
    items: [
      { key: "smart_home", label: "Smart-home system" },
      { key: "central_ac", label: "Central air conditioning" },
      { key: "chef_kitchen", label: "Chef's kitchen" },
      { key: "walk_in_closet", label: "Walk-in wardrobe" },
      { key: "study", label: "Study / library" },
      { key: "staff_quarters", label: "Staff quarters" },
      { key: "fireplace", label: "Fireplace" },
    ],
  },
  {
    category: "building",
    label: "Building & security",
    items: [
      { key: "lift", label: "Private lift" },
      { key: "concierge", label: "Concierge" },
      { key: "security_24h", label: "24-hour security" },
      { key: "gated_community", label: "Gated community" },
      { key: "generator", label: "Full-load generator" },
      { key: "ev_charging", label: "EV charging" },
      { key: "solar_power", label: "Solar power" },
    ],
  },
] as const;

export type AmenityKey = (typeof AMENITY_CATALOG)[number]["items"][number]["key"];
export const AMENITY_ITEMS: { key: AmenityKey; label: string; category: string }[] =
  AMENITY_CATALOG.flatMap((group) =>
    (group.items as readonly { key: AmenityKey; label: string }[]).map((item) => ({
      ...item,
      category: group.category,
    })),
  );
export const AMENITY_KEYS = AMENITY_CATALOG.flatMap((group) =>
  group.items.map((item) => item.key),
) as AmenityKey[];
export const AMENITY_LABELS = Object.fromEntries(
  AMENITY_CATALOG.flatMap((group) => group.items.map((item) => [item.key, item.label])),
) as Record<AmenityKey, string>;

/** Amenities exposed as quick toggles in search; each maps to an indexed amenity key. */
export const SEARCH_FEATURE_FILTERS = [
  "pool",
  "garden",
  "balcony",
  "terrace",
  "waterfront",
  "sea_view",
  "gym",
  "smart_home",
] as const satisfies readonly AmenityKey[];

export const LISTING_FLAGS = [
  "featured",
  "exclusive",
  "new-construction",
  "price-reduced",
] as const;
export type ListingFlag = (typeof LISTING_FLAGS)[number];
export const LISTING_FLAG_LABELS: Record<ListingFlag, string> = {
  featured: "Featured",
  exclusive: "Exclusive",
  "new-construction": "New construction",
  "price-reduced": "Price reduced",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "area-desc", label: "Largest first" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Budget steps used by search filters, in the site's default currency (BDT). */
export const PRICE_STEPS: Record<ListingType, number[]> = {
  sale: [
    20_000_000, 30_000_000, 50_000_000, 75_000_000, 100_000_000, 150_000_000, 200_000_000,
    300_000_000,
  ],
  rent: [100_000, 150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000],
};

export const AREA_STEPS = [1_000, 1_500, 2_000, 3_000, 4_000, 5_000, 7_500, 10_000];

export const SUPPORTED_CURRENCIES = ["BDT", "USD", "AED", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const VIRTUAL_TOUR_KINDS = ["video", "tour360", "external"] as const;
export type VirtualTourKind = (typeof VIRTUAL_TOUR_KINDS)[number];
