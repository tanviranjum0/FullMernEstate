export const USER_ROLES = ["user", "agent", "editor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Client",
  agent: "Advisor",
  editor: "Editor",
  admin: "Administrator",
};

export const INQUIRY_TYPES = [
  "property",
  "viewing",
  "general",
  "agent",
  "valuation",
  "consultation",
] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];
export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  property: "Property enquiry",
  viewing: "Viewing request",
  general: "General enquiry",
  agent: "Advisor enquiry",
  valuation: "Valuation request",
  consultation: "Consultation request",
};

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "viewing_scheduled",
  "negotiating",
  "won",
  "lost",
  "spam",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  viewing_scheduled: "Viewing scheduled",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};
export const OPEN_INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "qualified",
  "viewing_scheduled",
  "negotiating",
];

export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];
export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  phone: "Phone call",
  whatsapp: "WhatsApp",
};

export const VIEWING_TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
export type ViewingTimeSlot = (typeof VIEWING_TIME_SLOTS)[number];
export const VIEWING_TIME_SLOT_LABELS: Record<ViewingTimeSlot, string> = {
  morning: "Morning (9–12)",
  afternoon: "Afternoon (12–4)",
  evening: "Evening (4–7)",
};

export const ARTICLE_CATEGORIES = [
  {
    slug: "market-insights",
    name: "Market insights",
    description: "Analysis of pricing, supply and demand across the prime residential market.",
  },
  {
    slug: "architecture",
    name: "Architecture",
    description: "Design, materials and the architects shaping contemporary residences.",
  },
  {
    slug: "neighbourhood-guides",
    name: "Neighbourhood guides",
    description: "What it is like to live in the districts we know best.",
  },
  {
    slug: "buying-guides",
    name: "Buying guides",
    description: "Practical, step-by-step guidance for buyers and tenants.",
  },
  {
    slug: "investment",
    name: "Investment",
    description: "Yields, holding costs and long-term thinking for property investors.",
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
    description: "Living well at home: interiors, gardens, wellbeing and hospitality.",
  },
] as const;
export type ArticleCategorySlug = (typeof ARTICLE_CATEGORIES)[number]["slug"];
export const ARTICLE_CATEGORY_SLUGS = ARTICLE_CATEGORIES.map(
  (c) => c.slug,
) as ArticleCategorySlug[];
export function getArticleCategory(slug: string) {
  return ARTICLE_CATEGORIES.find((category) => category.slug === slug);
}

export const LOCATION_KINDS = ["city", "neighbourhood"] as const;
export type LocationKind = (typeof LOCATION_KINDS)[number];
