import { beforeAll, describe, expect, it } from "vitest";
import { parseSearchParams } from "@/lib/search/params";
import { PropertyModel } from "@/server/models/property";
import { mongoPropertySearch } from "@/server/search/property-search";
import { createLocations, createProperty, freshDatabase } from "./fixtures";

const search = (params: Record<string, string>, pageSize?: number) =>
  mongoPropertySearch.search(parseSearchParams(params), pageSize);
const titles = async (params: Record<string, string>) =>
  (await search(params)).items.map((item) => item.title);

describe("property search", () => {
  beforeAll(async () => {
    await freshDatabase("properties", "locations");
    await PropertyModel.syncIndexes();
    await createLocations();
    await createProperty({
      title: "Gulshan lake penthouse",
      propertyType: "penthouse",
      price: { amount: 120_000_000, currency: "BDT" },
      specs: { bedrooms: 5, bathrooms: 5, parkingSpaces: 3, areaSqft: 5200 },
      amenities: ["pool", "gym"],
    });
    await createProperty({
      title: "Banani family apartment",
      location: {
        citySlug: "dhaka",
        cityName: "Dhaka",
        neighbourhoodSlug: "banani",
        neighbourhoodName: "Banani",
      },
      price: { amount: 30_000_000, currency: "BDT" },
      specs: { bedrooms: 3, bathrooms: 2, parkingSpaces: 0, areaSqft: 1800 },
    });
    await createProperty({
      title: "Chattogram hill villa",
      propertyType: "villa",
      location: { citySlug: "chattogram", cityName: "Chattogram" },
      price: { amount: 60_000_000, previousAmount: 70_000_000, currency: "BDT" },
    });
    await createProperty({
      title: "Gulshan rental flat",
      listingType: "rent",
      price: { amount: 250_000, currency: "BDT" },
    });
    await createProperty({
      title: "Discreet residence",
      price: { amount: 999_000_000, currency: "BDT", onRequest: true },
    });
    await createProperty({ title: "Unpublished draft in Gulshan", status: "draft" });
    await createProperty({ title: "Archived Gulshan home", status: "archived" });
  });

  it("returns only published listings", async () => {
    const result = await search({});
    expect(result.total).toBe(5);
    expect(result.items.map((item) => item.title)).not.toEqual(
      expect.arrayContaining(["Unpublished draft in Gulshan", "Archived Gulshan home"]),
    );
  });

  it("filters by transaction, type, location and size", async () => {
    expect(await titles({ listing: "rent" })).toEqual(["Gulshan rental flat"]);
    expect(await titles({ type: "villa,penthouse", sort: "price-asc" })).toEqual([
      "Chattogram hill villa",
      "Gulshan lake penthouse",
    ]);
    expect(await titles({ city: "dhaka", neighbourhood: "banani" })).toEqual([
      "Banani family apartment",
    ]);
    expect(await titles({ beds: "4" })).toEqual(["Gulshan lake penthouse"]);
    expect(await titles({ features: "pool,gym" })).toEqual(["Gulshan lake penthouse"]);
    expect(await titles({ flags: "price-reduced" })).toEqual(["Chattogram hill villa"]);
  });

  it("keeps price-on-request listings in price-filtered results", async () => {
    expect(await titles({ listing: "sale", maxPrice: "40000000", sort: "price-asc" })).toEqual([
      "Banani family apartment",
      "Discreet residence",
    ]);
  });

  it("sorts and paginates deterministically", async () => {
    const page1 = await search({ listing: "sale", sort: "price-desc" }, 2);
    const page2 = await search({ listing: "sale", sort: "price-desc", page: "2" }, 2);
    expect(page1.pageCount).toBe(2);
    expect(page1.items.map((item) => item.title)).toEqual([
      "Discreet residence",
      "Gulshan lake penthouse",
    ]);
    expect(page2.items.map((item) => item.title)).toEqual([
      "Chattogram hill villa",
      "Banani family apartment",
    ]);
  });

  it("matches whole words with the text index and partial words with the fallback", async () => {
    expect(await titles({ q: "penthouse" })).toEqual(["Gulshan lake penthouse"]);
    expect((await titles({ q: "gulsh" })).sort()).toEqual([
      "Discreet residence",
      "Gulshan lake penthouse",
      "Gulshan rental flat",
    ]);
    expect(await titles({ q: "zzqqxx" })).toEqual([]);
  });

  it("never exposes the private address or exact coordinates in cards", async () => {
    await PropertyModel.updateOne(
      { title: "Banani family apartment" },
      {
        $set: {
          "location.addressLine": "House 7, Road 11",
          "location.geo": { type: "Point", coordinates: [90.40417, 23.79361] },
        },
      },
    );
    const [card] = (await search({ city: "dhaka", neighbourhood: "banani" })).items;
    expect(JSON.stringify(card)).not.toContain("House 7");
    expect(card?.coordinates).toEqual({ lat: 23.79, lng: 90.4 });
  });
});
