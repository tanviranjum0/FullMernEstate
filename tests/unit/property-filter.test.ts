import { describe, expect, it } from "vitest";
import { parseSearchParams } from "@/lib/search/params";
import {
  buildPropertyFilter,
  buildPropertySort,
  escapeRegex,
} from "@/server/search/property-filter";

const filterFor = (params: Record<string, string>, keywordMode?: "text" | "regex" | "none") =>
  buildPropertyFilter(parseSearchParams(params), { keywordMode });

describe("buildPropertyFilter", () => {
  it("only ever matches published listings", () => {
    expect(filterFor({})).toEqual({ status: "published" });
    expect(filterFor({ listing: "rent" })).toEqual({
      $and: [{ status: "published" }, { listingType: "rent" }],
    });
  });

  it("maps every filter to a typed condition", () => {
    const filter = filterFor({
      type: "villa",
      city: "dhaka",
      neighbourhood: "gulshan",
      beds: "3",
      baths: "2",
      minArea: "2000",
      features: "pool,gym",
      furnishing: "furnished",
      parking: "1",
      availability: "available",
      flags: "featured,new-construction",
    }) as { $and: unknown[] };
    expect(filter.$and).toEqual([
      { status: "published" },
      { propertyType: { $in: ["villa"] } },
      { "location.citySlug": "dhaka" },
      { "location.neighbourhoodSlug": "gulshan" },
      { "specs.bedrooms": { $gte: 3 } },
      { "specs.bathrooms": { $gte: 2 } },
      { "specs.areaSqft": { $gte: 2000 } },
      { amenities: { $all: ["pool", "gym"] } },
      { "specs.furnishing": "furnished" },
      { "specs.parkingSpaces": { $gte: 1 } },
      { availability: "available" },
      { "flags.featured": true },
      { "flags.newConstruction": true },
    ]);
  });

  it("keeps price-on-request listings visible under a price filter", () => {
    const filter = filterFor({ minPrice: "100", maxPrice: "200" }) as { $and: unknown[] };
    expect(filter.$and[1]).toEqual({
      $or: [{ "price.amount": { $gte: 100, $lte: 200 } }, { "price.onRequest": true }],
    });
  });

  it("ignores a neighbourhood without a city", () => {
    expect(filterFor({ neighbourhood: "gulshan" })).toEqual({ status: "published" });
  });

  it("uses the text index first and an escaped regex as fallback", () => {
    expect(filterFor({ q: "lake view" }, "text")).toEqual({
      $and: [{ $text: { $search: "lake view" } }, { status: "published" }],
    });
    const regex = filterFor({ q: "a.b*(" }, "regex") as {
      $and: [unknown, { $or: { title: RegExp }[] }];
    };
    const pattern = regex.$and[1].$or[0]!.title;
    expect(pattern.source).toBe("a\\.b\\*\\(");
    expect(pattern.flags).toBe("i");
    expect(filterFor({ q: "anything" }, "none")).toEqual({ status: "published" });
  });
});

describe("escapeRegex", () => {
  it("escapes every metacharacter", () => {
    const raw = ".*+?^${}()|[]\\";
    expect(new RegExp(escapeRegex(raw)).test(raw)).toBe(true);
  });
});

describe("buildPropertySort", () => {
  it("sorts deterministically with an _id tiebreaker", () => {
    expect(buildPropertySort(parseSearchParams({}), false)).toEqual({ publishedAt: -1, _id: -1 });
    expect(buildPropertySort(parseSearchParams({ sort: "price-asc" }), false)).toEqual({
      "price.amount": 1,
      _id: 1,
    });
    expect(buildPropertySort(parseSearchParams({ sort: "price-desc" }), false)).toEqual({
      "price.amount": -1,
      _id: -1,
    });
    expect(buildPropertySort(parseSearchParams({ sort: "area-desc" }), false)).toEqual({
      "specs.areaSqft": -1,
      _id: -1,
    });
  });

  it("ranks keyword searches by relevance unless another order was chosen", () => {
    expect(buildPropertySort(parseSearchParams({ q: "x" }), true)).toEqual({
      score: { $meta: "textScore" },
      publishedAt: -1,
      _id: -1,
    });
    expect(buildPropertySort(parseSearchParams({ q: "x", sort: "price-asc" }), true)).toEqual({
      "price.amount": 1,
      _id: 1,
    });
  });
});
