import { z } from "zod";
import { ARTICLE_CATEGORY_SLUGS, INQUIRY_STATUSES, USER_ROLES } from "@/config/domain";
import {
  AMENITY_KEYS,
  AVAILABILITY_STATUSES,
  FURNISHING_OPTIONS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
  SUPPORTED_CURRENCIES,
  VIRTUAL_TOUR_KINDS,
} from "@/config/property-options";
import { SLUG_PATTERN } from "@/lib/slug";

/** Slugs that would collide with static routes under the same prefix. */
export const RESERVED_SLUGS = new Set([
  "map",
  "new",
  "edit",
  "category",
  "page",
  "search",
  "admin",
  "api",
]);

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only")
  .refine((value) => !RESERVED_SLUGS.has(value), "This slug is reserved");

const optionalSlug = z.union([slug, z.literal("")]);
const text = (max: number) => z.string().trim().max(max);
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number({ error: "Enter a number" }).min(min).max(max).optional(),
  );
const requiredNumber = (min: number, max: number, message = "Enter a number") =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : Number(value)),
    z.number({ error: message }).min(min).max(max),
  );

/**
 * Media URLs must come from our own storage (uploads), our static assets, or known image CDNs
 * used by seeded/migrated content. Arbitrary hosts are rejected.
 */
const ALLOWED_MEDIA = [
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//,
  /^\/media\/[a-z0-9/_-]+\.webp$/i,
  /^\/images\/[a-z0-9/_.-]+$/i,
  /^https:\/\/images\.unsplash\.com\/photo-[\w-]+$/,
  /^https:\/\/res\.cloudinary\.com\//,
];
export const mediaSrc = z
  .string()
  .max(2048)
  .refine(
    (value) => ALLOWED_MEDIA.some((pattern) => pattern.test(value)),
    "Image must be uploaded through the media library",
  );

export const mediaImageInput = z.object({
  src: mediaSrc,
  width: z.number().int().min(1).max(20_000),
  height: z.number().int().min(1).max(20_000),
  alt: text(300).default(""),
  caption: text(300).default(""),
  blurDataURL: z
    .string()
    .max(6_000)
    .regex(/^(data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+)?$/, "Invalid placeholder")
    .default(""),
  storageKey: text(300).default(""),
});
export type MediaImageInput = z.infer<typeof mediaImageInput>;

const httpsUrl = z.union([
  z.literal(""),
  z.url({ protocol: /^https$/, error: "Use a full https:// link" }).max(2048),
]);
const seoInput = z.object({ title: text(70).default(""), description: text(170).default("") });

export const propertyInput = z
  .object({
    title: z.string().trim().min(4, "Add a title").max(140),
    slug: optionalSlug.default(""),
    headline: text(220).default(""),
    description: z
      .string()
      .trim()
      .min(40, "Write at least a short description (40+ characters)")
      .max(12_000),
    status: z.enum(PUBLICATION_STATUSES),
    listingType: z.enum(LISTING_TYPES),
    propertyType: z.enum(PROPERTY_TYPES),
    availability: z.enum(AVAILABILITY_STATUSES),
    price: z.object({
      amount: requiredNumber(0, 1e13, "Enter the price"),
      currency: z.enum(SUPPORTED_CURRENCIES),
      previousAmount: optionalNumber(0, 1e13),
      onRequest: z.boolean().default(false),
    }),
    specs: z.object({
      bedrooms: requiredNumber(0, 50),
      bathrooms: requiredNumber(0, 50),
      areaSqft: optionalNumber(0, 5_000_000),
      landAreaSqft: optionalNumber(0, 50_000_000),
      parkingSpaces: requiredNumber(0, 50),
      yearBuilt: optionalNumber(1800, 2100),
      floors: optionalNumber(0, 200),
      floorLevel: optionalNumber(-5, 200),
      furnishing: z.union([z.enum(FURNISHING_OPTIONS), z.literal("")]).default(""),
    }),
    amenities: z.array(z.enum(AMENITY_KEYS)).max(60).default([]),
    flags: z.object({
      featured: z.boolean().default(false),
      exclusive: z.boolean().default(false),
      newConstruction: z.boolean().default(false),
    }),
    location: z.object({
      citySlug: slug,
      neighbourhoodSlug: optionalSlug.default(""),
      displayAddress: text(200).default(""),
      addressLine: text(300).default(""),
      showExactLocation: z.boolean().default(false),
      lat: optionalNumber(-90, 90),
      lng: optionalNumber(-180, 180),
    }),
    images: z.array(mediaImageInput).max(60).default([]),
    floorPlans: z
      .array(mediaImageInput.extend({ label: text(120).default("") }))
      .max(20)
      .default([]),
    videoUrl: httpsUrl.default(""),
    virtualTour: z.object({
      url: httpsUrl.default(""),
      kind: z.enum(VIRTUAL_TOUR_KINDS).default("tour360"),
    }),
    agentId: z.union([z.string().regex(/^[a-f0-9]{24}$/i), z.literal("")]).default(""),
    seo: seoInput.default({ title: "", description: "" }),
  })
  .superRefine((data, ctx) => {
    if ((data.location.lat === undefined) !== (data.location.lng === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["location", "lat"],
        message: "Provide both latitude and longitude",
      });
    }
    if (data.price.amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["price", "amount"],
        message: "Enter the price — it is still used for search when shown as “on request”",
      });
    }
    if (data.status === "published" && data.images.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: "Add at least one photograph before publishing",
      });
    }
    if (data.price.previousAmount !== undefined && data.price.previousAmount <= data.price.amount) {
      ctx.addIssue({
        code: "custom",
        path: ["price", "previousAmount"],
        message: "The previous price must be higher than the current price",
      });
    }
  });
export type PropertyInput = z.infer<typeof propertyInput>;

export const agentInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: optionalSlug.default(""),
  title: text(120).default(""),
  bio: text(6_000).default(""),
  photo: mediaImageInput.nullable().default(null),
  email: z.union([z.literal(""), z.email().max(254)]).default(""),
  phone: text(40).default(""),
  whatsapp: text(40).default(""),
  languages: z.array(text(40)).max(12).default([]),
  specialties: z.array(text(80)).max(12).default([]),
  areas: z.array(slug).max(30).default([]),
  socials: z.object({
    linkedin: httpsUrl.default(""),
    instagram: httpsUrl.default(""),
    website: httpsUrl.default(""),
  }),
  active: z.boolean().default(true),
  sortOrder: requiredNumber(0, 10_000).default(100),
  userEmail: z.union([z.literal(""), z.email()]).default(""),
  seo: seoInput.default({ title: "", description: "" }),
});
export type AgentInput = z.infer<typeof agentInput>;

const faqInput = z.object({
  question: z.string().trim().min(3).max(240),
  answer: z.string().trim().min(3).max(2_000),
});

export const locationInput = z
  .object({
    kind: z.enum(["city", "neighbourhood"]),
    name: z.string().trim().min(2).max(120),
    slug: optionalSlug.default(""),
    parentSlug: optionalSlug.default(""),
    headline: text(200).default(""),
    intro: text(1_200).default(""),
    body: text(20_000).default(""),
    heroImage: mediaImageInput.nullable().default(null),
    highlights: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          text: z.string().trim().min(2).max(600),
        }),
      )
      .max(12)
      .default([]),
    lifestyle: z.array(text(60)).max(20).default([]),
    nearby: z.array(text(80)).max(20).default([]),
    marketNotes: text(4_000).default(""),
    faqs: z.array(faqInput).max(20).default([]),
    lat: optionalNumber(-90, 90),
    lng: optionalNumber(-180, 180),
    zoom: requiredNumber(1, 18).default(12),
    published: z.boolean().default(false),
    sortOrder: requiredNumber(0, 10_000).default(100),
    seo: seoInput.default({ title: "", description: "" }),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "neighbourhood" && !data.parentSlug) {
      ctx.addIssue({
        code: "custom",
        path: ["parentSlug"],
        message: "Choose the city this neighbourhood belongs to",
      });
    }
  });
export type LocationInput = z.infer<typeof locationInput>;

export const articleInput = z.object({
  title: z.string().trim().min(4).max(160),
  slug: optionalSlug.default(""),
  excerpt: text(320).default(""),
  body: z.string().trim().min(100, "Write at least 100 characters").max(60_000),
  coverImage: mediaImageInput.nullable().default(null),
  category: z.enum(ARTICLE_CATEGORY_SLUGS),
  authorId: z.union([z.string().regex(/^[a-f0-9]{24}$/i), z.literal("")]).default(""),
  authorName: text(120).default(""),
  tags: z.array(text(40)).max(15).default([]),
  relatedLocationSlugs: z.array(slug).max(15).default([]),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
  seo: seoInput.default({ title: "", description: "" }),
});
export type ArticleInput = z.infer<typeof articleInput>;

export const siteSettingsInput = z.object({
  contact: z.object({
    email: z.union([z.literal(""), z.email()]).default(""),
    phone: text(40).default(""),
    whatsapp: text(40).default(""),
    address: text(300).default(""),
    officeHours: text(200).default(""),
  }),
  social: z.object({
    instagram: httpsUrl.default(""),
    linkedin: httpsUrl.default(""),
    facebook: httpsUrl.default(""),
    youtube: httpsUrl.default(""),
  }),
  hero: z.object({
    eyebrow: text(80).default(""),
    headline: text(120).default(""),
    subheadline: text(300).default(""),
    image: mediaImageInput.nullable().default(null),
    videoUrl: z
      .union([
        z.literal(""),
        z
          .string()
          .regex(
            /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/.+\.(mp4|webm)$/i,
            "Upload video to media storage",
          ),
      ])
      .default(""),
  }),
  about: z.object({
    story: text(12_000).default(""),
    values: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(120),
          text: z.string().trim().min(2).max(600),
        }),
      )
      .max(8)
      .default([]),
  }),
  testimonials: z
    .array(
      z.object({
        quote: z.string().trim().min(10).max(1_200),
        author: z.string().trim().min(2).max(120),
        context: text(160).default(""),
        published: z.boolean().default(false),
      }),
    )
    .max(30)
    .default([]),
  faqs: z.array(faqInput).max(30).default([]),
  announcement: text(240).default(""),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInput>;

export const inquiryUpdateInput = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  assignedTo: z.union([z.string().regex(/^[a-f0-9]{24}$/i), z.literal("")]).optional(),
  note: z.string().trim().min(1).max(4_000).optional(),
});

export const userUpdateInput = z.object({
  role: z.enum(USER_ROLES).optional(),
  disabled: z.boolean().optional(),
});
