import "server-only";
import { after } from "next/server";
import { updateTag } from "next/cache";
import { Types } from "mongoose";
import type { CurrentUser } from "@/lib/auth/session";
import { canManageProperty, hasPermission } from "@/lib/auth/permissions";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getMediaStorage } from "@/lib/media/storage";
import type { PropertyInput } from "@/lib/validation/admin";
import { cacheTags } from "@/server/cache-tags";
import { AgentModel } from "@/server/models/agent";
import { LocationModel } from "@/server/models/location";
import { PropertyModel, type PropertyRecord } from "@/server/models/property";
import { FavoriteModel, RecentViewModel } from "@/server/models/user-data";
import { recordAudit } from "@/server/services/audit";
import { AdminActionError, storageKeysOf, uniqueSlug } from "./shared";

function invalidate(...slugs: string[]) {
  updateTag(cacheTags.properties);
  for (const slug of new Set(slugs.filter(Boolean))) updateTag(cacheTags.property(slug));
}

function scheduleMediaCleanup(removed: string[]) {
  if (removed.length === 0) return;
  after(async () => {
    const storage = getMediaStorage();
    for (const key of removed) {
      try {
        await storage.deleteFolder(key);
      } catch (error) {
        console.error("[media] failed to delete", { key, error: (error as Error).message });
      }
    }
  });
}

async function resolveLocation(input: PropertyInput["location"]) {
  const city = await LocationModel.findOne({ kind: "city", slug: input.citySlug }, { name: 1 }).lean();
  if (!city) throw new AdminActionError("Choose a valid city", "validation", "location.citySlug");
  let neighbourhoodName = "";
  if (input.neighbourhoodSlug) {
    const neighbourhood = await LocationModel.findOne(
      { kind: "neighbourhood", parentSlug: input.citySlug, slug: input.neighbourhoodSlug },
      { name: 1 },
    ).lean();
    if (!neighbourhood) throw new AdminActionError("Choose a neighbourhood within the selected city", "validation", "location.neighbourhoodSlug");
    neighbourhoodName = neighbourhood.name;
  }
  return {
    citySlug: input.citySlug,
    cityName: city.name,
    neighbourhoodSlug: input.neighbourhoodSlug,
    neighbourhoodName,
    displayAddress: input.displayAddress,
    addressLine: input.addressLine,
    showExactLocation: input.showExactLocation,
    geo:
      input.lat !== undefined && input.lng !== undefined
        ? { type: "Point" as const, coordinates: [input.lng, input.lat] }
        : undefined,
  };
}

/**
 * Decides which advisor a listing belongs to. Advisors can only assign listings to themselves;
 * administrators may assign any active advisor.
 */
async function resolveAgent(actor: CurrentUser, requested: string): Promise<Types.ObjectId | undefined> {
  if (!hasPermission(actor.role, "properties:manage_all")) {
    if (!actor.agentId) throw new AdminActionError("Your account is not linked to an advisor profile.", "forbidden");
    return new Types.ObjectId(actor.agentId);
  }
  if (!requested) return undefined;
  const agent = await AgentModel.exists({ _id: requested, active: true });
  if (!agent) throw new AdminActionError("Choose an active advisor", "validation", "agentId");
  return new Types.ObjectId(requested);
}

export async function saveProperty(actor: CurrentUser, id: string | null, input: PropertyInput) {
  await connectToDatabase();
  const existing = id ? await PropertyModel.findById(id).lean<PropertyRecord>() : null;
  if (id && !existing) throw new AdminActionError("This listing no longer exists.", "not_found");
  if (existing && !canManageProperty(actor, { agentId: existing.agent?.toString() ?? null })) {
    throw new AdminActionError("You can only edit listings assigned to you.", "forbidden");
  }
  if (!existing && !hasPermission(actor.role, "properties:manage_all") && !hasPermission(actor.role, "properties:manage_own")) {
    throw new AdminActionError("You do not have permission to create listings.", "forbidden");
  }
  if (input.status === "published" && !hasPermission(actor.role, "properties:publish")) {
    throw new AdminActionError("You do not have permission to publish listings.", "forbidden");
  }

  const [location, agent] = await Promise.all([resolveLocation(input.location), resolveAgent(actor, input.agentId)]);
  const slug = await uniqueSlug(PropertyModel, input.slug || input.title, { excludeId: id ?? undefined });

  // Featured/exclusive placement is an editorial decision reserved for administrators.
  const isAdmin = hasPermission(actor.role, "properties:manage_all");
  const flags = {
    featured: isAdmin ? input.flags.featured : Boolean(existing?.flags?.featured),
    exclusive: isAdmin ? input.flags.exclusive : Boolean(existing?.flags?.exclusive),
    newConstruction: input.flags.newConstruction,
  };

  const now = new Date();
  const priceChanged = existing ? existing.price?.amount !== input.price.amount : false;
  const document = {
    slug,
    title: input.title,
    headline: input.headline,
    description: input.description,
    status: input.status,
    listingType: input.listingType,
    propertyType: input.propertyType,
    availability: input.availability,
    price: {
      amount: input.price.amount,
      currency: input.price.currency,
      previousAmount: input.price.previousAmount,
      onRequest: input.price.onRequest,
    },
    specs: { ...input.specs, furnishing: input.specs.furnishing || undefined },
    amenities: input.amenities,
    flags,
    location,
    images: input.images,
    floorPlans: input.floorPlans,
    video: { url: input.videoUrl },
    virtualTour: input.virtualTour,
    agent,
    seo: input.seo,
    publishedAt: input.status === "published" ? (existing?.publishedAt ?? now) : existing?.publishedAt,
    priceChangedAt: priceChanged ? now : existing?.priceChangedAt,
    updatedBy: actor.id,
  };

  let saved: PropertyRecord;
  if (existing) {
    const unset: Record<string, 1> = {};
    if (!location.geo) unset["location.geo"] = 1;
    if (document.price.previousAmount === undefined) unset["price.previousAmount"] = 1;
    if (!agent) unset.agent = 1;
    saved = (await PropertyModel.findByIdAndUpdate(
      id,
      { $set: document, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { returnDocument: "after", runValidators: true, lean: true },
    ))!;
  } else {
    saved = (await PropertyModel.create({ ...document, createdBy: actor.id })).toObject();
  }

  const removed = [...storageKeysOf(existing?.images), ...storageKeysOf(existing?.floorPlans)].filter(
    (key) => !storageKeysOf(input.images).has(key) && !storageKeysOf(input.floorPlans).has(key),
  );
  scheduleMediaCleanup(removed);

  await recordAudit(
    actor,
    existing ? "property.updated" : "property.created",
    "property",
    saved._id.toString(),
    `${existing ? "Updated" : "Created"} “${saved.title}” (${saved.status})`,
    existing ? changedTopLevel(existing, document) : [],
  );
  invalidate(slug, existing?.slug ?? "");
  return { id: saved._id.toString(), slug: saved.slug };
}

function changedTopLevel(before: PropertyRecord, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((key) => {
    if (key === "updatedBy") return false;
    return JSON.stringify((before as unknown as Record<string, unknown>)[key] ?? null) !== JSON.stringify(after[key] ?? null);
  });
}

export async function setPropertyStatus(actor: CurrentUser, id: string, status: "draft" | "published" | "archived") {
  await connectToDatabase();
  const existing = await PropertyModel.findById(id).lean<PropertyRecord>();
  if (!existing) throw new AdminActionError("This listing no longer exists.", "not_found");
  if (!canManageProperty(actor, { agentId: existing.agent?.toString() ?? null })) {
    throw new AdminActionError("You can only change listings assigned to you.", "forbidden");
  }
  if (status === "published") {
    if (!hasPermission(actor.role, "properties:publish")) throw new AdminActionError("You cannot publish listings.", "forbidden");
    if (!existing.images?.length) throw new AdminActionError("Add at least one photograph before publishing.");
  }
  await PropertyModel.updateOne(
    { _id: id },
    { $set: { status, updatedBy: actor.id, ...(status === "published" && !existing.publishedAt ? { publishedAt: new Date() } : {}) } },
  );
  await recordAudit(actor, `property.${status}`, "property", id, `Set “${existing.title}” to ${status}`);
  invalidate(existing.slug);
}

export async function deleteProperty(actor: CurrentUser, id: string) {
  await connectToDatabase();
  const existing = await PropertyModel.findById(id).lean<PropertyRecord>();
  if (!existing) throw new AdminActionError("This listing no longer exists.", "not_found");
  if (!hasPermission(actor.role, "properties:manage_all")) {
    throw new AdminActionError("Only administrators can permanently delete listings. Archive it instead.", "forbidden");
  }
  await PropertyModel.deleteOne({ _id: id });
  await Promise.all([
    FavoriteModel.deleteMany({ property: existing._id }),
    RecentViewModel.deleteMany({ property: existing._id }),
  ]);
  scheduleMediaCleanup([...storageKeysOf(existing.images), ...storageKeysOf(existing.floorPlans)]);
  await recordAudit(actor, "property.deleted", "property", id, `Deleted “${existing.title}”`);
  invalidate(existing.slug);
}
