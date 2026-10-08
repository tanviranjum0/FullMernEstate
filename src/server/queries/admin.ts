import "server-only";
import { Types } from "mongoose";
import {
  OPEN_INQUIRY_STATUSES,
  type InquiryStatus,
  type InquiryType,
  type UserRole,
} from "@/config/domain";
import type { CurrentUser } from "@/lib/auth/session";
import { canManageInquiry, canManageProperty, hasPermission } from "@/lib/auth/permissions";
import { connectToDatabase } from "@/lib/db/mongoose";
import { escapeRegex } from "@/server/search/property-filter";
import { AgentModel, type AgentRecord } from "@/server/models/agent";
import { ArticleModel, type ArticleRecord } from "@/server/models/article";
import { InquiryModel, type InquiryRecord } from "@/server/models/inquiry";
import { LocationModel, type LocationRecord } from "@/server/models/location";
import { PropertyModel, type PropertyRecord } from "@/server/models/property";
import { SiteSettingsModel, type SiteSettingsRecord } from "@/server/models/site-settings";
import { AuditLogModel } from "@/server/models/system";
import { UserModel } from "@/server/models/user-data";
import { inquiryReference } from "@/server/services/inquiries";
import { metricSeries, metricTotals } from "@/server/services/metrics";
import type {
  AgentInput,
  ArticleInput,
  LocationInput,
  MediaImageInput,
  PropertyInput,
  SiteSettingsInput,
} from "@/lib/validation/admin";

export const ADMIN_PAGE_SIZE = 20;

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

function paginate(page: number) {
  const safe = Math.max(1, Math.min(500, Math.floor(page) || 1));
  return { page: safe, skip: (safe - 1) * ADMIN_PAGE_SIZE, limit: ADMIN_PAGE_SIZE };
}

function toImageInput(image: unknown): MediaImageInput | null {
  const img = image as Partial<MediaImageInput> | null | undefined;
  if (!img?.src || !img.width || !img.height) return null;
  return {
    src: img.src,
    width: img.width,
    height: img.height,
    alt: img.alt ?? "",
    caption: img.caption ?? "",
    blurDataURL: img.blurDataURL ?? "",
    storageKey: img.storageKey ?? "",
  };
}

/** Restricts property queries to the actor's own listings unless they can manage all. */
function propertyScope(actor: CurrentUser): Record<string, unknown> {
  if (hasPermission(actor.role, "properties:manage_all")) return {};
  return {
    agent: actor.agentId
      ? new Types.ObjectId(actor.agentId)
      : new Types.ObjectId("000000000000000000000000"),
  };
}

function inquiryScope(actor: CurrentUser): Record<string, unknown> {
  if (hasPermission(actor.role, "inquiries:manage_all")) return {};
  return {
    assignedTo: actor.agentId
      ? new Types.ObjectId(actor.agentId)
      : new Types.ObjectId("000000000000000000000000"),
  };
}

/* ----------------------------------------------------------------------------------------------
 * Dashboard
 * --------------------------------------------------------------------------------------------*/

export async function getDashboardData(actor: CurrentUser) {
  await connectToDatabase();
  const pScope = propertyScope(actor);
  const iScope = inquiryScope(actor);
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const canSeeProperties =
    hasPermission(actor.role, "properties:manage_all") ||
    hasPermission(actor.role, "properties:manage_own");
  const canSeeInquiries =
    hasPermission(actor.role, "inquiries:manage_all") ||
    hasPermission(actor.role, "inquiries:manage_own");

  const [
    statusCounts,
    inquiryCounts,
    newInquiries,
    recentInquiries,
    users,
    agents,
    metrics,
    series,
    activity,
    topViewed,
  ] = await Promise.all([
    canSeeProperties
      ? PropertyModel.aggregate<{ _id: string; count: number }>([
          { $match: pScope },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    canSeeInquiries
      ? InquiryModel.aggregate<{ _id: string; count: number }>([
          { $match: { ...iScope, createdAt: { $gte: since30 } } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
    canSeeInquiries
      ? InquiryModel.countDocuments({ ...iScope, status: "new" })
      : Promise.resolve(0),
    canSeeInquiries
      ? InquiryModel.find(iScope, {
          name: 1,
          type: 1,
          status: 1,
          propertySnapshot: 1,
          createdAt: 1,
        })
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      : Promise.resolve([]),
    hasPermission(actor.role, "users:manage")
      ? UserModel.estimatedDocumentCount()
      : Promise.resolve(null),
    AgentModel.countDocuments({ active: true }),
    hasPermission(actor.role, "properties:manage_all")
      ? metricTotals(
          [
            "property_view",
            "inquiry",
            "viewing_request",
            "favorite_add",
            "share",
            "phone_click",
            "email_click",
            "whatsapp_click",
            "saved_search",
          ],
          30,
        )
      : Promise.resolve({} as Record<string, number>),
    canSeeInquiries ? inquirySeries(iScope, 30) : Promise.resolve([]),
    hasPermission(actor.role, "audit:read")
      ? AuditLogModel.find({}, { actor: 1, summary: 1, createdAt: 1, action: 1 })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean()
      : Promise.resolve([]),
    canSeeProperties
      ? PropertyModel.find({ ...pScope, status: "published" }, { title: 1, slug: 1, viewCount: 1 })
          .sort({ viewCount: -1 })
          .limit(5)
          .lean()
      : Promise.resolve([]),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]));
  return {
    properties: {
      total: statusCounts.reduce((sum, row) => sum + row.count, 0),
      published: byStatus.published ?? 0,
      draft: byStatus.draft ?? 0,
      archived: byStatus.archived ?? 0,
    },
    inquiries: {
      last30: inquiryCounts.reduce((sum, row) => sum + row.count, 0),
      byType: inquiryCounts.map((row) => ({ type: row._id as InquiryType, count: row.count })),
      newCount: newInquiries,
      recent: recentInquiries.map((row) => ({
        id: row._id.toString(),
        name: row.name,
        type: row.type as InquiryType,
        status: row.status as InquiryStatus,
        property: row.propertySnapshot?.title ?? "",
        createdAt: new Date(row.createdAt).toISOString(),
      })),
      series,
    },
    users,
    agents,
    metrics,
    activity: activity.map((row) => ({
      id: row._id.toString(),
      actor: row.actor?.email ?? "",
      summary: row.summary,
      action: row.action,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
    topViewed: topViewed.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      views: row.viewCount ?? 0,
    })),
    canSeeProperties,
    canSeeInquiries,
  };
}

async function inquirySeries(scope: Record<string, unknown>, days: number) {
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await InquiryModel.aggregate<{ _id: string; count: number }>([
    { $match: { ...scope, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(since.getTime() + index * 86_400_000).toISOString().slice(0, 10);
    return { day, count: byDay.get(day) ?? 0 };
  });
}

export { metricSeries };

/* ----------------------------------------------------------------------------------------------
 * Properties
 * --------------------------------------------------------------------------------------------*/

export interface AdminPropertyRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  availability: string;
  listingType: string;
  propertyType: string;
  price: number;
  currency: string;
  onRequest: boolean;
  location: string;
  image: string | null;
  agentName: string;
  featured: boolean;
  exclusive: boolean;
  updatedAt: string;
}

export async function listAdminProperties(
  actor: CurrentUser,
  {
    q,
    status,
    listing,
    page = 1,
  }: { q?: string; status?: string; listing?: string; page?: number },
): Promise<AdminPage<AdminPropertyRow>> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { ...propertyScope(actor) };
  if (status && ["draft", "published", "archived"].includes(status)) filter.status = status;
  if (listing && ["sale", "rent"].includes(listing)) filter.listingType = listing;
  if (q) {
    const pattern = new RegExp(escapeRegex(q.slice(0, 80)), "i");
    filter.$or = [
      { title: pattern },
      { slug: pattern },
      { "location.neighbourhoodName": pattern },
      { "location.cityName": pattern },
    ];
  }
  const { page: current, skip, limit } = paginate(page);
  const [rows, total] = await Promise.all([
    PropertyModel.find(filter, {
      slug: 1,
      title: 1,
      status: 1,
      availability: 1,
      listingType: 1,
      propertyType: 1,
      price: 1,
      "location.cityName": 1,
      "location.neighbourhoodName": 1,
      images: { $slice: 1 },
      agent: 1,
      flags: 1,
      updatedAt: 1,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ agent: { name: string } | null }>({ path: "agent", select: "name" })
      .lean(),
    PropertyModel.countDocuments(filter),
  ]);
  type Row = PropertyRecord & { agent: { name: string } | null };
  return {
    items: (rows as unknown as Row[]).map((row) => ({
      id: row._id.toString(),
      slug: row.slug,
      title: row.title,
      status: row.status,
      availability: row.availability,
      listingType: row.listingType,
      propertyType: row.propertyType,
      price: row.price?.amount ?? 0,
      currency: row.price?.currency ?? "BDT",
      onRequest: Boolean(row.price?.onRequest),
      location: [row.location?.neighbourhoodName, row.location?.cityName]
        .filter(Boolean)
        .join(", "),
      image: row.images?.[0]?.src ?? null,
      agentName: row.agent?.name ?? "",
      featured: Boolean(row.flags?.featured),
      exclusive: Boolean(row.flags?.exclusive),
      updatedAt: new Date(row.updatedAt).toISOString(),
    })),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export function emptyPropertyInput(actor: CurrentUser): PropertyInput {
  return {
    title: "",
    slug: "",
    headline: "",
    description: "",
    status: "draft",
    listingType: "sale",
    propertyType: "apartment",
    availability: "available",
    price: { amount: 0, currency: "BDT", previousAmount: undefined, onRequest: false },
    specs: {
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: undefined,
      landAreaSqft: undefined,
      parkingSpaces: 1,
      yearBuilt: undefined,
      floors: undefined,
      floorLevel: undefined,
      furnishing: "",
    },
    amenities: [],
    flags: { featured: false, exclusive: false, newConstruction: false },
    location: {
      citySlug: "",
      neighbourhoodSlug: "",
      displayAddress: "",
      addressLine: "",
      showExactLocation: false,
      lat: undefined,
      lng: undefined,
    },
    images: [],
    floorPlans: [],
    videoUrl: "",
    virtualTour: { url: "", kind: "tour360" },
    agentId: actor.agentId ?? "",
    seo: { title: "", description: "" },
  };
}

export async function getAdminProperty(
  actor: CurrentUser,
  id: string,
): Promise<{ input: PropertyInput; slug: string; status: string } | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await PropertyModel.findById(id).lean<PropertyRecord>();
  if (!doc || !canManageProperty(actor, { agentId: doc.agent?.toString() ?? null })) return null;
  const coords = doc.location?.geo?.coordinates as [number, number] | undefined;
  return {
    slug: doc.slug,
    status: doc.status,
    input: {
      title: doc.title,
      slug: doc.slug,
      headline: doc.headline ?? "",
      description: doc.description,
      status: doc.status as PropertyInput["status"],
      listingType: doc.listingType as PropertyInput["listingType"],
      propertyType: doc.propertyType as PropertyInput["propertyType"],
      availability: doc.availability as PropertyInput["availability"],
      price: {
        amount: doc.price?.amount ?? 0,
        currency: (doc.price?.currency ?? "BDT") as PropertyInput["price"]["currency"],
        previousAmount: doc.price?.previousAmount ?? undefined,
        onRequest: Boolean(doc.price?.onRequest),
      },
      specs: {
        bedrooms: doc.specs?.bedrooms ?? 0,
        bathrooms: doc.specs?.bathrooms ?? 0,
        areaSqft: doc.specs?.areaSqft ?? undefined,
        landAreaSqft: doc.specs?.landAreaSqft ?? undefined,
        parkingSpaces: doc.specs?.parkingSpaces ?? 0,
        yearBuilt: doc.specs?.yearBuilt ?? undefined,
        floors: doc.specs?.floors ?? undefined,
        floorLevel: doc.specs?.floorLevel ?? undefined,
        furnishing: (doc.specs?.furnishing ?? "") as PropertyInput["specs"]["furnishing"],
      },
      amenities: (doc.amenities ?? []) as PropertyInput["amenities"],
      flags: {
        featured: Boolean(doc.flags?.featured),
        exclusive: Boolean(doc.flags?.exclusive),
        newConstruction: Boolean(doc.flags?.newConstruction),
      },
      location: {
        citySlug: doc.location?.citySlug ?? "",
        neighbourhoodSlug: doc.location?.neighbourhoodSlug ?? "",
        displayAddress: doc.location?.displayAddress ?? "",
        addressLine: doc.location?.addressLine ?? "",
        showExactLocation: Boolean(doc.location?.showExactLocation),
        lat: coords?.[1],
        lng: coords?.[0],
      },
      images: (doc.images ?? []).map(toImageInput).filter((i): i is MediaImageInput => Boolean(i)),
      floorPlans: (doc.floorPlans ?? [])
        .map((plan) => {
          const image = toImageInput(plan);
          return image ? { ...image, label: plan.label ?? "" } : null;
        })
        .filter((p): p is MediaImageInput & { label: string } => Boolean(p)),
      videoUrl: doc.video?.url ?? "",
      virtualTour: {
        url: doc.virtualTour?.url ?? "",
        kind: (doc.virtualTour?.kind ?? "tour360") as PropertyInput["virtualTour"]["kind"],
      },
      agentId: doc.agent?.toString() ?? "",
      seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    },
  };
}

/* ----------------------------------------------------------------------------------------------
 * Shared option lists
 * --------------------------------------------------------------------------------------------*/

export async function getAdminOptions() {
  await connectToDatabase();
  const [agents, locations] = await Promise.all([
    AgentModel.find({}, { name: 1, active: 1 }).sort({ sortOrder: 1, name: 1 }).lean(),
    LocationModel.find({}, { kind: 1, slug: 1, parentSlug: 1, name: 1, center: 1 })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  ]);
  return {
    agents: agents.map((a) => ({ id: a._id.toString(), name: a.name, active: a.active })),
    cities: locations
      .filter((l) => l.kind === "city")
      .map((city) => ({
        slug: city.slug,
        name: city.name,
        center:
          city.center?.lat !== undefined && city.center?.lat !== null
            ? { lat: city.center.lat, lng: city.center.lng as number }
            : null,
        neighbourhoods: locations
          .filter((l) => l.kind === "neighbourhood" && l.parentSlug === city.slug)
          .map((n) => ({
            slug: n.slug,
            name: n.name,
            center:
              n.center?.lat !== undefined && n.center?.lat !== null
                ? { lat: n.center.lat, lng: n.center.lng as number }
                : null,
          })),
      })),
  };
}
export type AdminOptions = Awaited<ReturnType<typeof getAdminOptions>>;

/* ----------------------------------------------------------------------------------------------
 * Enquiries
 * --------------------------------------------------------------------------------------------*/

export interface AdminInquiryRow {
  id: string;
  reference: string;
  type: InquiryType;
  status: InquiryStatus;
  name: string;
  email: string;
  property: string;
  assignedName: string;
  createdAt: string;
}

export async function listAdminInquiries(
  actor: CurrentUser,
  { q, status, type, page = 1 }: { q?: string; status?: string; type?: string; page?: number },
): Promise<AdminPage<AdminInquiryRow>> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { ...inquiryScope(actor) };
  if (status === "open") filter.status = { $in: OPEN_INQUIRY_STATUSES };
  else if (status) filter.status = status;
  if (type) filter.type = type;
  if (q) {
    const pattern = new RegExp(escapeRegex(q.slice(0, 80)), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { "propertySnapshot.title": pattern }];
  }
  const { page: current, skip, limit } = paginate(page);
  const [rows, total] = await Promise.all([
    InquiryModel.find(filter, {
      type: 1,
      status: 1,
      name: 1,
      email: 1,
      propertySnapshot: 1,
      assignedTo: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ assignedTo: { name: string } | null }>({ path: "assignedTo", select: "name" })
      .lean(),
    InquiryModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      id: row._id.toString(),
      reference: inquiryReference(row._id.toString()),
      type: row.type as InquiryType,
      status: row.status as InquiryStatus,
      name: row.name,
      email: row.email,
      property: row.propertySnapshot?.title ?? "",
      assignedName: row.assignedTo?.name ?? "",
      createdAt: new Date(row.createdAt).toISOString(),
    })),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminInquiry(actor: CurrentUser, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await InquiryModel.findById(id).lean<InquiryRecord>();
  if (!doc || !canManageInquiry(actor, { assignedAgentId: doc.assignedTo?.toString() ?? null }))
    return null;
  const [assigned, audit] = await Promise.all([
    doc.assignedTo ? AgentModel.findById(doc.assignedTo, { name: 1 }).lean() : null,
    AuditLogModel.find(
      { entityType: "inquiry", entityId: id },
      { summary: 1, actor: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);
  return {
    id,
    reference: inquiryReference(id),
    type: doc.type as InquiryType,
    status: doc.status as InquiryStatus,
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    preferredContact: doc.preferredContact ?? "email",
    message: doc.message ?? "",
    property: doc.propertySnapshot?.slug
      ? { title: doc.propertySnapshot.title, slug: doc.propertySnapshot.slug }
      : null,
    viewing: doc.viewing?.date
      ? { date: new Date(doc.viewing.date).toISOString(), timeSlot: doc.viewing.timeSlot ?? null }
      : null,
    source: doc.source?.path ?? "",
    assignedTo: doc.assignedTo?.toString() ?? "",
    assignedName: assigned?.name ?? "",
    hasAccount: Boolean(doc.user),
    notes: (doc.notes ?? []).map((note) => ({
      id: note._id.toString(),
      author: note.authorName,
      body: note.body,
      createdAt: new Date(note.createdAt).toISOString(),
    })),
    history: audit.map((row) => ({
      id: row._id.toString(),
      summary: row.summary,
      actor: row.actor?.email ?? "",
      createdAt: new Date(row.createdAt).toISOString(),
    })),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

/* ----------------------------------------------------------------------------------------------
 * Advisors, users, locations, articles, settings, audit
 * --------------------------------------------------------------------------------------------*/

export async function listAdminAgents() {
  await connectToDatabase();
  const [agents, counts] = await Promise.all([
    AgentModel.find({}).sort({ sortOrder: 1, name: 1 }).lean<AgentRecord[]>(),
    PropertyModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { agent: { $ne: null } } },
      { $group: { _id: "$agent", count: { $sum: 1 } } },
    ]),
  ]);
  const byAgent = new Map(counts.map((row) => [row._id.toString(), row.count]));
  return agents.map((agent) => ({
    id: agent._id.toString(),
    slug: agent.slug,
    name: agent.name,
    title: agent.title ?? "",
    email: agent.email ?? "",
    active: agent.active,
    linked: Boolean(agent.userId),
    listings: byAgent.get(agent._id.toString()) ?? 0,
  }));
}

export async function getAdminAgent(
  id: string,
): Promise<{ input: AgentInput; slug: string } | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await AgentModel.findById(id).lean<AgentRecord>();
  if (!doc) return null;
  const user = doc.userId ? await UserModel.findById(doc.userId, { email: 1 }).lean() : null;
  return {
    slug: doc.slug,
    input: {
      name: doc.name,
      slug: doc.slug,
      title: doc.title ?? "",
      bio: doc.bio ?? "",
      photo: toImageInput(doc.photo),
      email: doc.email ?? "",
      phone: doc.phone ?? "",
      whatsapp: doc.whatsapp ?? "",
      languages: doc.languages ?? [],
      specialties: doc.specialties ?? [],
      areas: doc.areas ?? [],
      socials: {
        linkedin: doc.socials?.linkedin ?? "",
        instagram: doc.socials?.instagram ?? "",
        website: doc.socials?.website ?? "",
      },
      active: doc.active,
      sortOrder: doc.sortOrder ?? 100,
      userEmail: user?.email ?? "",
      seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    },
  };
}

export async function listAdminUsers({
  q,
  role,
  page = 1,
}: {
  q?: string;
  role?: string;
  page?: number;
}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (role && ["user", "agent", "editor", "admin"].includes(role)) filter.role = role;
  if (q) {
    const pattern = new RegExp(escapeRegex(q.slice(0, 80)), "i");
    filter.$or = [{ email: pattern }, { name: pattern }];
  }
  const { page: current, skip, limit } = paginate(page);
  const [rows, total] = await Promise.all([
    UserModel.find(filter, { name: 1, email: 1, role: 1, disabled: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      id: row._id.toString(),
      name: row.name ?? "",
      email: row.email ?? "",
      role: (row.role ?? "user") as UserRole,
      disabled: Boolean(row.disabled),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    })),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function listAdminLocations() {
  await connectToDatabase();
  const rows = await LocationModel.find(
    {},
    { kind: 1, slug: 1, parentSlug: 1, name: 1, published: 1, updatedAt: 1, sortOrder: 1 },
  )
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const cities = rows.filter((row) => row.kind === "city");
  return cities.map((city) => ({
    id: city._id.toString(),
    name: city.name,
    slug: city.slug,
    published: city.published,
    neighbourhoods: rows
      .filter((row) => row.kind === "neighbourhood" && row.parentSlug === city.slug)
      .map((n) => ({ id: n._id.toString(), name: n.name, slug: n.slug, published: n.published })),
  }));
}

export async function getAdminLocation(
  id: string,
): Promise<{ input: LocationInput; href: string } | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await LocationModel.findById(id).lean<LocationRecord>();
  if (!doc) return null;
  return {
    href:
      doc.kind === "city" ? `/locations/${doc.slug}` : `/locations/${doc.parentSlug}/${doc.slug}`,
    input: {
      kind: doc.kind as LocationInput["kind"],
      name: doc.name,
      slug: doc.slug,
      parentSlug: doc.parentSlug ?? "",
      headline: doc.headline ?? "",
      intro: doc.intro ?? "",
      body: doc.body ?? "",
      heroImage: toImageInput(doc.heroImage),
      highlights: (doc.highlights ?? []).map((h) => ({ title: h.title, text: h.text })),
      lifestyle: doc.lifestyle ?? [],
      nearby: doc.nearby ?? [],
      marketNotes: doc.marketNotes ?? "",
      faqs: (doc.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
      lat: doc.center?.lat ?? undefined,
      lng: doc.center?.lng ?? undefined,
      zoom: doc.zoom ?? 12,
      published: doc.published,
      sortOrder: doc.sortOrder ?? 100,
      seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    },
  };
}

export async function listAdminArticles({
  q,
  status,
  page = 1,
}: {
  q?: string;
  status?: string;
  page?: number;
}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (status === "draft" || status === "published") filter.status = status;
  if (q) filter.title = new RegExp(escapeRegex(q.slice(0, 80)), "i");
  const { page: current, skip, limit } = paginate(page);
  const [rows, total] = await Promise.all([
    ArticleModel.find(filter, {
      title: 1,
      slug: 1,
      status: 1,
      category: 1,
      featured: 1,
      publishedAt: 1,
      updatedAt: 1,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ArticleModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      slug: row.slug,
      status: row.status,
      category: row.category,
      featured: Boolean(row.featured),
      publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
      updatedAt: new Date(row.updatedAt).toISOString(),
    })),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminArticle(
  id: string,
): Promise<{ input: ArticleInput; slug: string; status: string } | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const doc = await ArticleModel.findById(id).lean<ArticleRecord>();
  if (!doc) return null;
  return {
    slug: doc.slug,
    status: doc.status,
    input: {
      title: doc.title,
      slug: doc.slug,
      excerpt: doc.excerpt ?? "",
      body: doc.body,
      coverImage: toImageInput(doc.coverImage),
      category: doc.category as ArticleInput["category"],
      authorId: doc.author?.toString() ?? "",
      authorName: doc.authorName ?? "",
      tags: doc.tags ?? [],
      relatedLocationSlugs: doc.relatedLocationSlugs ?? [],
      status: doc.status as ArticleInput["status"],
      featured: Boolean(doc.featured),
      seo: { title: doc.seo?.title ?? "", description: doc.seo?.description ?? "" },
    },
  };
}

export async function getAdminSettings(): Promise<SiteSettingsInput> {
  await connectToDatabase();
  const doc = await SiteSettingsModel.findOne({ key: "global" }).lean<SiteSettingsRecord>();
  return {
    contact: {
      email: doc?.contact?.email ?? "",
      phone: doc?.contact?.phone ?? "",
      whatsapp: doc?.contact?.whatsapp ?? "",
      address: doc?.contact?.address ?? "",
      officeHours: doc?.contact?.officeHours ?? "",
    },
    social: {
      instagram: doc?.social?.instagram ?? "",
      linkedin: doc?.social?.linkedin ?? "",
      facebook: doc?.social?.facebook ?? "",
      youtube: doc?.social?.youtube ?? "",
    },
    hero: {
      eyebrow: doc?.hero?.eyebrow ?? "",
      headline: doc?.hero?.headline ?? "",
      subheadline: doc?.hero?.subheadline ?? "",
      image: toImageInput(doc?.hero?.image),
      videoUrl: doc?.hero?.videoUrl ?? "",
    },
    about: {
      story: doc?.about?.story ?? "",
      values: (doc?.about?.values ?? []).map((v) => ({ title: v.title, text: v.text })),
    },
    testimonials: (doc?.testimonials ?? []).map((t) => ({
      quote: t.quote,
      author: t.author,
      context: t.context ?? "",
      published: Boolean(t.published),
    })),
    faqs: (doc?.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
    announcement: doc?.announcement ?? "",
  };
}

export async function listAuditLog({
  entityType,
  page = 1,
}: {
  entityType?: string;
  page?: number;
}) {
  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (entityType) filter.entityType = entityType;
  const { page: current, skip, limit } = paginate(page);
  const [rows, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLogModel.countDocuments(filter),
  ]);
  return {
    items: rows.map((row) => ({
      id: row._id.toString(),
      actor: row.actor?.email ?? "",
      role: row.actor?.role ?? "",
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId ?? "",
      summary: row.summary ?? "",
      createdAt: new Date(row.createdAt).toISOString(),
    })),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}
