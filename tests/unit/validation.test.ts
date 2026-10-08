import { describe, expect, it } from "vitest";
import { propertyInput, siteSettingsInput, userUpdateInput } from "@/lib/validation/admin";
import { inquirySchema } from "@/lib/validation/inquiry";
import { replaceFields } from "@/server/services/admin/shared";

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const PROPERTY_ID = "6ac74c21c6afc2b99b8c0f50";

describe("inquirySchema", () => {
  const valid = {
    type: "viewing",
    propertyId: PROPERTY_ID,
    name: "Test Person",
    email: " Person@Example.com ",
    preferredContact: "email",
    viewingDate: day(3),
    consent: "on",
  };

  it("accepts a complete viewing request and normalises it", () => {
    const parsed = inquirySchema.parse(valid);
    expect(parsed.email).toBe("person@example.com");
    expect(parsed.consent).toBe(true);
  });

  it("requires explicit consent", () => {
    const result = inquirySchema.safeParse({ ...valid, consent: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["consent"]);
  });

  it("rejects the honeypot, past dates and far-future dates", () => {
    expect(inquirySchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, viewingDate: day(-1) }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, viewingDate: day(400) }).success).toBe(false);
  });

  it("needs a phone number when the client prefers a call", () => {
    const result = inquirySchema.safeParse({ ...valid, preferredContact: "phone" });
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("phone");
    expect(
      inquirySchema.safeParse({ ...valid, preferredContact: "phone", phone: "+880 1711-000000" })
        .success,
    ).toBe(true);
  });

  it("needs a message for general enquiries and a property for listing enquiries", () => {
    expect(
      inquirySchema.safeParse({ ...valid, type: "general", propertyId: "", viewingDate: "" })
        .success,
    ).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, type: "property", propertyId: "" }).success).toBe(
      false,
    );
    expect(inquirySchema.safeParse({ ...valid, propertyId: "not-an-id" }).success).toBe(false);
  });
});

describe("propertyInput", () => {
  const image = {
    src: "/media/property/abc/w1920.webp",
    width: 1920,
    height: 1280,
    alt: "Living room",
  };
  const valid = {
    title: "Lake terrace residence",
    description: "A bright four-bedroom apartment with a deep terrace facing the lake.",
    status: "draft",
    listingType: "sale",
    propertyType: "apartment",
    availability: "available",
    price: { amount: 85_000_000, currency: "BDT" },
    specs: { bedrooms: 4, bathrooms: 4, parkingSpaces: 2 },
    flags: {},
    location: { citySlug: "dhaka" },
    virtualTour: {},
  };
  const issues = (input: unknown) =>
    propertyInput.safeParse(input).error?.issues.map((issue) => issue.path.join(".")) ?? [];

  it("accepts a minimal draft and fills defaults", () => {
    const parsed = propertyInput.parse(valid);
    expect(parsed.images).toEqual([]);
    expect(parsed.price.onRequest).toBe(false);
    expect(parsed.seo).toEqual({ title: "", description: "" });
  });

  it("requires a positive price and a photograph before publishing", () => {
    expect(issues({ ...valid, price: { amount: 0, currency: "BDT" } })).toContain("price.amount");
    expect(issues({ ...valid, status: "published" })).toContain("images");
    expect(issues({ ...valid, status: "published", images: [image] })).toEqual([]);
  });

  it("checks coordinates, previous price and slugs", () => {
    expect(issues({ ...valid, location: { citySlug: "dhaka", lat: 23.79 } })).toContain(
      "location.lat",
    );
    expect(
      issues({ ...valid, price: { amount: 100, previousAmount: 90, currency: "BDT" } }),
    ).toContain("price.previousAmount");
    expect(issues({ ...valid, slug: "map" })).toContain("slug");
    expect(issues({ ...valid, slug: "Not A Slug" })).toContain("slug");
  });

  it("only accepts media from our storage or known image CDNs", () => {
    expect(
      issues({ ...valid, images: [{ ...image, src: "https://evil.example/x.jpg" }] }),
    ).toContain("images.0.src");
    expect(issues({ ...valid, images: [{ ...image, src: "/media/../../etc/passwd" }] })).toContain(
      "images.0.src",
    );
    expect(issues({ ...valid, videoUrl: "http://insecure.example/video" })).toContain("videoUrl");
  });
});

describe("other admin schemas", () => {
  it("rejects unknown roles and hero videos from outside media storage", () => {
    expect(userUpdateInput.safeParse({ role: "superadmin" }).success).toBe(false);
    const settings = siteSettingsInput.safeParse({
      contact: {},
      social: {},
      hero: { videoUrl: "https://evil.example/v.mp4" },
      about: {},
    });
    expect(settings.error?.issues[0]?.path.join(".")).toBe("hero.videoUrl");
  });
});

describe("replaceFields", () => {
  it("sets defined fields, unsets undefined top-level fields and never overlaps paths", () => {
    const update = replaceFields({
      title: "A",
      agent: undefined,
      price: { amount: 5, previousAmount: undefined },
      images: [{ src: "a", caption: undefined }],
      publishedAt: new Date(0),
    });
    expect(update).toEqual({
      $set: { title: "A", price: { amount: 5 }, images: [{ src: "a" }], publishedAt: new Date(0) },
      $unset: { agent: 1 },
    });
    expect(replaceFields({ title: "B" })).toEqual({ $set: { title: "B" } });
  });
});
