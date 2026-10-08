import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { propertyInput, type PropertyInput } from "@/lib/validation/admin";
import { savePropertyAction } from "@/server/actions/admin";
import { AuditLogModel } from "@/server/models/system";
import { PropertyModel } from "@/server/models/property";
import { FavoriteModel } from "@/server/models/user-data";
import { deleteProperty, saveProperty, setPropertyStatus } from "@/server/services/admin/properties";
import { actAs } from "../setup/session-state";
import { createAgent, createLocations, freshDatabase, staff } from "./fixtures";

const image = { src: "/media/property/abc/w1920.webp", width: 1920, height: 1280, alt: "Living room" };

function input(overrides: Partial<Record<keyof PropertyInput, unknown>> = {}): PropertyInput {
  return propertyInput.parse({
    title: "Lake terrace residence",
    description: "A bright four-bedroom apartment with a deep terrace facing the lake.",
    status: "draft",
    listingType: "sale",
    propertyType: "apartment",
    availability: "available",
    price: { amount: 85_000_000, currency: "BDT" },
    specs: { bedrooms: 4, bathrooms: 4, parkingSpaces: 2 },
    flags: {},
    location: { citySlug: "dhaka", neighbourhoodSlug: "gulshan" },
    virtualTour: {},
    ...overrides,
  });
}

describe("listing management", () => {
  let agentId: string;
  const admin = staff("admin");

  beforeAll(async () => {
    await freshDatabase("properties", "locations", "agents", "auditlogs", "audit_logs", "favorites", "recent_views");
    await createLocations();
    agentId = (await createAgent())._id.toString();
  });

  beforeEach(() => actAs(null));

  it("creates a draft with a unique slug and denormalised location names", async () => {
    const first = await saveProperty(admin, null, input());
    const second = await saveProperty(admin, null, input());
    expect(first.slug).toBe("lake-terrace-residence");
    expect(second.slug).toBe("lake-terrace-residence-2");

    const stored = await PropertyModel.findById(first.id).lean();
    expect(stored?.status).toBe("draft");
    expect(stored?.location?.cityName).toBe("Dhaka");
    expect(stored?.location?.neighbourhoodName).toBe("Gulshan");
    expect(stored?.publishedAt).toBeUndefined();
    expect(await AuditLogModel.countDocuments({ entityId: first.id, action: "property.created" })).toBe(1);
  });

  it("clears optional fields on update without conflicting paths", async () => {
    const created = await saveProperty(
      admin,
      null,
      input({ agentId, price: { amount: 80_000_000, previousAmount: 90_000_000, currency: "BDT" }, location: { citySlug: "dhaka", lat: 23.79, lng: 90.41 } }),
    );
    await saveProperty(admin, created.id, input({ status: "published", images: [image] }));

    const stored = await PropertyModel.findById(created.id).lean();
    expect(stored?.status).toBe("published");
    expect(stored?.publishedAt).toBeInstanceOf(Date);
    expect(stored?.agent).toBeUndefined();
    expect(stored?.price?.previousAmount).toBeUndefined();
    expect(stored?.location?.geo).toBeUndefined();
    expect(stored?.price?.amount).toBe(85_000_000);
  });

  it("rejects unknown locations and inactive advisors", async () => {
    await expect(saveProperty(admin, null, input({ location: { citySlug: "atlantis" } }))).rejects.toThrow(/valid city/);
    await expect(saveProperty(admin, null, input({ location: { citySlug: "chattogram", neighbourhoodSlug: "gulshan" } }))).rejects.toThrow(
      /neighbourhood/,
    );
    const inactive = await createAgent({ active: false });
    await expect(saveProperty(admin, null, input({ agentId: inactive._id.toString() }))).rejects.toThrow(/active advisor/);
  });

  it("keeps advisors to their own listings and admin-only placement", async () => {
    const advisor = staff("agent", agentId);
    const own = await saveProperty(advisor, null, input({ flags: { featured: true, exclusive: true } }));
    const ownStored = await PropertyModel.findById(own.id).lean();
    expect(ownStored?.agent?.toString()).toBe(agentId);
    expect(ownStored?.flags?.featured).toBe(false);

    const otherAgent = (await createAgent())._id.toString();
    const theirs = await saveProperty(admin, null, input({ agentId: otherAgent }));
    await expect(saveProperty(advisor, theirs.id, input())).rejects.toThrow(/assigned to you/);
    await expect(setPropertyStatus(advisor, theirs.id, "published")).rejects.toThrow();
    await expect(deleteProperty(advisor, own.id)).rejects.toThrow(/administrators/);
    await expect(saveProperty(staff("editor"), null, input())).rejects.toThrow(/permission/);
  });

  it("deletes a listing together with the favourites that point at it", async () => {
    const created = await saveProperty(admin, null, input({ status: "published", images: [image] }));
    await FavoriteModel.create({ user: admin.id, property: created.id });
    await deleteProperty(admin, created.id);
    expect(await PropertyModel.exists({ _id: created.id })).toBeNull();
    expect(await FavoriteModel.countDocuments({ property: created.id })).toBe(0);
  });

  it("checks authentication, permission and validation in the server action", async () => {
    expect(await savePropertyAction(null, input())).toMatchObject({ ok: false, code: "unauthenticated" });

    actAs(staff("user"));
    expect(await savePropertyAction(null, input())).toMatchObject({ ok: false, code: "forbidden" });

    actAs(admin);
    const invalid = await savePropertyAction(null, { ...input(), title: "", price: { amount: 0, currency: "BDT" } });
    expect(invalid).toMatchObject({ ok: false, code: "validation" });
    if (!invalid.ok) expect(Object.keys(invalid.fieldErrors ?? {})).toEqual(expect.arrayContaining(["title", "price.amount"]));

    const injected = await savePropertyAction(null, { ...input(), status: { $ne: "draft" } });
    expect(injected).toMatchObject({ ok: false, code: "validation" });

    const saved = await savePropertyAction(null, input({ title: "Saved through the action" }));
    expect(saved).toMatchObject({ ok: true, data: { slug: "saved-through-the-action" } });
  });
});
