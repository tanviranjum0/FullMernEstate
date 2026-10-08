import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  getSearchIndexability,
  parseSearchParams,
  searchHref,
  serializeSearchQuery,
} from "@/lib/search/params";

describe("parseSearchParams", () => {
  it("returns safe defaults for an empty query", () => {
    expect(parseSearchParams({})).toEqual({
      q: undefined,
      listing: undefined,
      types: [],
      city: undefined,
      neighbourhood: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      beds: undefined,
      baths: undefined,
      minArea: undefined,
      maxArea: undefined,
      features: [],
      furnishing: undefined,
      parking: false,
      availability: undefined,
      flags: [],
      sort: "newest",
      page: 1,
    });
  });

  it("keeps only known values and drops malformed ones", () => {
    const query = parseSearchParams({
      listing: "lease",
      type: "villa,castle,villa,penthouse",
      city: "Dhaka",
      neighbourhood: "../etc",
      beds: "99",
      baths: "2",
      minPrice: "-5",
      features: "pool,helipad",
      sort: "random",
      page: "0",
    });
    expect(query.listing).toBeUndefined();
    expect(query.types).toEqual(["villa", "penthouse"]);
    expect(query.city).toBe("dhaka");
    expect(query.neighbourhood).toBeUndefined();
    expect(query.beds).toBeUndefined();
    expect(query.baths).toBe(2);
    expect(query.minPrice).toBeUndefined();
    expect(query.features).toEqual(["pool"]);
    expect(query.sort).toBe("newest");
    expect(query.page).toBe(1);
  });

  it("never lets an object or operator through", () => {
    const query = parseSearchParams({ city: "{\"$ne\":null}", minPrice: "1e9", q: "  gulshan  " });
    expect(query.city).toBeUndefined();
    expect(query.minPrice).toBeUndefined();
    expect(query.q).toBe("gulshan");
  });

  it("swaps inverted ranges", () => {
    const query = parseSearchParams({ minPrice: "900", maxPrice: "100", minArea: "5000", maxArea: "1000" });
    expect([query.minPrice, query.maxPrice]).toEqual([100, 900]);
    expect([query.minArea, query.maxArea]).toEqual([1000, 5000]);
  });

  it("reads URLSearchParams and the first value of repeated keys", () => {
    expect(parseSearchParams(new URLSearchParams("listing=rent&page=3")).page).toBe(3);
    expect(parseSearchParams({ listing: ["sale", "rent"] }).listing).toBe("sale");
  });
});

describe("serializeSearchQuery", () => {
  it("produces a stable, minimal URL", () => {
    const query = parseSearchParams({ type: "villa,apartment", listing: "sale", sort: "newest", page: "1", city: "dhaka" });
    expect(serializeSearchQuery(query).toString()).toBe("listing=sale&type=apartment%2Cvilla&city=dhaka");
  });

  it("drops a neighbourhood without its city", () => {
    expect(searchHref({ neighbourhood: "gulshan" })).toBe("/properties");
  });

  it("round-trips through parse", () => {
    const original = parseSearchParams({ listing: "rent", beds: "3", parking: "1", flags: "featured", sort: "price-asc", page: "2" });
    expect(parseSearchParams(serializeSearchQuery(original))).toEqual(original);
  });

  it("can omit the page for filter links", () => {
    expect(serializeSearchQuery({ page: 4, listing: "sale" }, { includePage: false }).toString()).toBe("listing=sale");
  });
});

describe("countActiveFilters", () => {
  it("counts ranges once and ignores sort and page", () => {
    const query = parseSearchParams({ minPrice: "1", maxPrice: "2", beds: "2", sort: "price-asc", page: "3" });
    expect(countActiveFilters(query)).toBe(2);
  });
});

describe("getSearchIndexability", () => {
  it("indexes the catalogue and the buy/rent splits", () => {
    expect(getSearchIndexability(parseSearchParams({}))).toEqual({ indexable: true, canonicalPath: "/properties" });
    expect(getSearchIndexability(parseSearchParams({ listing: "rent" }))).toEqual({
      indexable: true,
      canonicalPath: "/properties?listing=rent",
    });
  });

  it("keeps pagination of indexable pages self-canonical", () => {
    expect(getSearchIndexability(parseSearchParams({ listing: "sale", page: "2" })).canonicalPath).toBe("/properties?listing=sale&page=2");
  });

  it("noindexes filtered permutations and points them at their parent", () => {
    expect(getSearchIndexability(parseSearchParams({ listing: "sale", beds: "3" }))).toEqual({
      indexable: false,
      canonicalPath: "/properties?listing=sale",
    });
    expect(getSearchIndexability(parseSearchParams({ sort: "price-asc" })).indexable).toBe(false);
  });
});
