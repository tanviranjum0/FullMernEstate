import "server-only";
import { updateTag } from "next/cache";
import { Types } from "mongoose";
import type { CurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { readingTimeMinutes } from "@/lib/format";
import type { AgentInput, ArticleInput, LocationInput, SiteSettingsInput } from "@/lib/validation/admin";
import { cacheTags } from "@/server/cache-tags";
import { AgentModel, type AgentRecord } from "@/server/models/agent";
import { ArticleModel, type ArticleRecord } from "@/server/models/article";
import { LocationModel, type LocationRecord } from "@/server/models/location";
import { PropertyModel } from "@/server/models/property";
import { SiteSettingsModel } from "@/server/models/site-settings";
import { UserModel } from "@/server/models/user-data";
import { recordAudit } from "@/server/services/audit";
import { AdminActionError, replaceFields, uniqueSlug } from "./shared";

/* ----------------------------------------------------------------------------------------------
 * Advisors
 * --------------------------------------------------------------------------------------------*/

export async function saveAgent(actor: CurrentUser, id: string | null, input: AgentInput) {
  await connectToDatabase();
  const existing = id ? await AgentModel.findById(id).lean<AgentRecord>() : null;
  if (id && !existing) throw new AdminActionError("This advisor no longer exists.", "not_found");

  let userId = existing?.userId ?? "";
  if (input.userEmail) {
    const user = await UserModel.findOne({ email: input.userEmail.toLowerCase() }, { _id: 1 }).lean();
    if (!user) throw new AdminActionError("No account exists with that email. Ask the advisor to register first.", "validation", "userEmail");
    userId = user._id.toString();
    const linked = await AgentModel.exists(id ? { userId, _id: { $ne: id } } : { userId });
    if (linked) throw new AdminActionError("That account is already linked to another advisor.", "conflict", "userEmail");
    await UserModel.updateOne({ _id: user._id, role: "user" }, { $set: { role: "agent" } });
  } else if (!input.userEmail && existing?.userId) {
    userId = "";
  }

  const slug = await uniqueSlug(AgentModel, input.slug || input.name, { excludeId: id ?? undefined });
  const document = {
    slug,
    name: input.name,
    title: input.title,
    bio: input.bio,
    photo: input.photo ?? undefined,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    languages: input.languages.filter(Boolean),
    specialties: input.specialties.filter(Boolean),
    areas: input.areas,
    socials: input.socials,
    active: input.active,
    sortOrder: input.sortOrder,
    userId,
    seo: input.seo,
  };
  const saved = existing
    ? (await AgentModel.findByIdAndUpdate(id, replaceFields(document), { returnDocument: "after", lean: true }))!
    : (await AgentModel.create(document)).toObject();

  await recordAudit(actor, existing ? "agent.updated" : "agent.created", "agent", saved._id.toString(), `${existing ? "Updated" : "Created"} advisor ${saved.name}${input.active ? "" : " (inactive)"}`);
  updateTag(cacheTags.agents);
  updateTag(cacheTags.agent(slug));
  if (existing?.slug && existing.slug !== slug) updateTag(cacheTags.agent(existing.slug));
  updateTag(cacheTags.properties);
  return { id: saved._id.toString(), slug };
}

/* ----------------------------------------------------------------------------------------------
 * Locations
 * --------------------------------------------------------------------------------------------*/

export async function saveLocation(actor: CurrentUser, id: string | null, input: LocationInput) {
  await connectToDatabase();
  const existing = id ? await LocationModel.findById(id).lean<LocationRecord>() : null;
  if (id && !existing) throw new AdminActionError("This location no longer exists.", "not_found");

  const parentSlug = input.kind === "neighbourhood" ? input.parentSlug : "";
  if (parentSlug && !(await LocationModel.exists({ kind: "city", slug: parentSlug }))) {
    throw new AdminActionError("Choose an existing city", "validation", "parentSlug");
  }
  const slug = await uniqueSlug(LocationModel, input.slug || input.name, { excludeId: id ?? undefined, scope: { parentSlug } });
  if (existing && existing.slug !== slug) {
    const inUse =
      existing.kind === "city"
        ? await PropertyModel.exists({ "location.citySlug": existing.slug })
        : await PropertyModel.exists({ "location.neighbourhoodSlug": existing.slug, "location.citySlug": existing.parentSlug });
    if (inUse) throw new AdminActionError("Listings use this location, so its URL slug cannot change.", "conflict", "slug");
  }

  const document = {
    kind: input.kind,
    slug,
    parentSlug,
    name: input.name,
    headline: input.headline,
    intro: input.intro,
    body: input.body,
    heroImage: input.heroImage ?? undefined,
    highlights: input.highlights,
    lifestyle: input.lifestyle.filter(Boolean),
    nearby: input.nearby.filter(Boolean),
    marketNotes: input.marketNotes,
    faqs: input.faqs,
    center: input.lat !== undefined && input.lng !== undefined ? { lat: input.lat, lng: input.lng } : undefined,
    zoom: input.zoom,
    published: input.published,
    sortOrder: input.sortOrder,
    seo: input.seo,
  };
  const saved = existing
    ? (await LocationModel.findByIdAndUpdate(id, replaceFields(document), { returnDocument: "after", lean: true }))!
    : (await LocationModel.create(document)).toObject();

  // Keep denormalised names on listings in sync when a location is renamed.
  if (existing && existing.name !== input.name) {
    const field = existing.kind === "city" ? "location.cityName" : "location.neighbourhoodName";
    const match = existing.kind === "city" ? { "location.citySlug": slug } : { "location.citySlug": parentSlug, "location.neighbourhoodSlug": slug };
    await PropertyModel.updateMany(match, { $set: { [field]: input.name } });
    updateTag(cacheTags.properties);
  }

  await recordAudit(actor, existing ? "location.updated" : "location.created", "location", saved._id.toString(), `${existing ? "Updated" : "Created"} ${input.kind} ${input.name}`);
  updateTag(cacheTags.locations);
  updateTag(cacheTags.location(parentSlug ? `${parentSlug}/${slug}` : slug));
  return { id: saved._id.toString(), slug };
}

/* ----------------------------------------------------------------------------------------------
 * Articles
 * --------------------------------------------------------------------------------------------*/

export async function saveArticle(actor: CurrentUser, id: string | null, input: ArticleInput) {
  await connectToDatabase();
  const existing = id ? await ArticleModel.findById(id).lean<ArticleRecord>() : null;
  if (id && !existing) throw new AdminActionError("This article no longer exists.", "not_found");
  if (input.authorId && !(await AgentModel.exists({ _id: input.authorId }))) {
    throw new AdminActionError("Choose a valid author", "validation", "authorId");
  }
  const slug = await uniqueSlug(ArticleModel, input.slug || input.title, { excludeId: id ?? undefined });
  const document = {
    slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    coverImage: input.coverImage ?? undefined,
    category: input.category,
    author: input.authorId ? new Types.ObjectId(input.authorId) : undefined,
    authorName: input.authorName,
    tags: input.tags.filter(Boolean),
    relatedLocationSlugs: input.relatedLocationSlugs,
    status: input.status,
    featured: input.featured,
    readingMinutes: readingTimeMinutes(input.body),
    publishedAt: input.status === "published" ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt,
    seo: input.seo,
    updatedBy: actor.id,
  };
  const saved = existing
    ? (await ArticleModel.findByIdAndUpdate(id, replaceFields(document), { returnDocument: "after", lean: true }))!
    : (await ArticleModel.create({ ...document, createdBy: actor.id })).toObject();

  await recordAudit(actor, existing ? "article.updated" : "article.created", "article", saved._id.toString(), `${existing ? "Updated" : "Created"} “${input.title}” (${input.status})`);
  updateTag(cacheTags.articles);
  updateTag(cacheTags.article(slug));
  if (existing?.slug && existing.slug !== slug) updateTag(cacheTags.article(existing.slug));
  return { id: saved._id.toString(), slug };
}

export async function deleteArticle(actor: CurrentUser, id: string) {
  await connectToDatabase();
  const existing = await ArticleModel.findByIdAndDelete(id).lean<ArticleRecord>();
  if (!existing) throw new AdminActionError("This article no longer exists.", "not_found");
  await recordAudit(actor, "article.deleted", "article", id, `Deleted “${existing.title}”`);
  updateTag(cacheTags.articles);
  updateTag(cacheTags.article(existing.slug));
}

/* ----------------------------------------------------------------------------------------------
 * Site settings
 * --------------------------------------------------------------------------------------------*/

export async function saveSiteSettings(actor: CurrentUser, input: SiteSettingsInput) {
  await connectToDatabase();
  const document = {
    key: "global",
    contact: input.contact,
    social: input.social,
    hero: { ...input.hero, image: input.hero.image ?? undefined },
    about: input.about,
    testimonials: input.testimonials,
    faqs: input.faqs,
    announcement: input.announcement,
    updatedBy: actor.id,
  };
  await SiteSettingsModel.findOneAndUpdate({ key: "global" }, replaceFields(document), { upsert: true });
  await recordAudit(actor, "settings.updated", "settings", "global", "Updated site settings");
  updateTag(cacheTags.settings);
}
