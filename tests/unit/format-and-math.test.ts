import { describe, expect, it } from "vitest";
import { formatArea, formatPrice, initials, pluralize, readingTimeMinutes } from "@/lib/format";
import { calculateMortgage } from "@/lib/mortgage";
import { rankSimilar, similarityScore, type RecommendationSubject } from "@/lib/recommendations";
import { slugify } from "@/lib/slug";

describe("formatPrice", () => {
  it("uses lakh and crore for Bangladeshi Taka", () => {
    expect(formatPrice(85_000_000, "BDT", { compact: true })).toBe("BDT 8.5 Crore");
    expect(formatPrice(450_000, "BDT", { compact: true })).toBe("BDT 4.5 Lakh");
    expect(formatPrice(12_500_000, "BDT")).toBe("BDT 1,25,00,000");
    expect(formatPrice(150_000, "BDT", { period: "month" })).toBe("BDT 1,50,000 / month");
  });

  it("formats other currencies internationally", () => {
    expect(formatPrice(1_250_000, "USD")).toBe("$1,250,000");
    expect(formatPrice(1_250_000, "USD", { compact: true })).toBe("$1.3M");
    expect(formatPrice(2_500, "GBP", { period: "month" })).toBe("£2,500 / month");
  });
});

describe("text helpers", () => {
  it("formats areas, plurals, initials and reading time", () => {
    expect(formatArea(3200)).toBe("3,200 sq ft");
    expect(pluralize(1, "bed")).toBe("1 bed");
    expect(pluralize(3, "bed")).toBe("3 beds");
    expect(initials("Ayesha Rahman")).toBe("AR");
    expect(readingTimeMinutes("word ".repeat(450))).toBeGreaterThanOrEqual(2);
    expect(readingTimeMinutes("")).toBeGreaterThanOrEqual(1);
  });

  it("slugifies titles predictably", () => {
    expect(slugify("Gulshan Sky Penthouse — for Lease!")).toBe("gulshan-sky-penthouse-for-lease");
    expect(slugify("Cox's Bazar & Inani")).toBe("coxs-bazar-and-inani");
    expect(slugify("Café Résidence")).toBe("cafe-residence");
    expect(slugify("***")).toBe("item");
  });
});

describe("calculateMortgage", () => {
  it("matches the standard amortisation formula", () => {
    const result = calculateMortgage({
      price: 1_000_000,
      depositPercent: 20,
      annualRatePercent: 6,
      years: 25,
    });
    expect(result.deposit).toBe(200_000);
    expect(result.loanAmount).toBe(800_000);
    expect(result.monthlyPayment).toBe(5154);
    expect(result.totalRepayable).toBe(Math.round(result.totalInterest + result.loanAmount));
  });

  it("handles a zero rate and clamps nonsense input", () => {
    expect(
      calculateMortgage({ price: 120_000, depositPercent: 0, annualRatePercent: 0, years: 10 })
        .monthlyPayment,
    ).toBe(1000);
    const clamped = calculateMortgage({
      price: -5,
      depositPercent: 150,
      annualRatePercent: -3,
      years: 0,
    });
    expect(clamped).toEqual({
      deposit: 0,
      loanAmount: 0,
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayable: 0,
    });
  });
});

describe("recommendations", () => {
  const base: RecommendationSubject = {
    id: "a",
    listingType: "sale",
    propertyType: "apartment",
    citySlug: "dhaka",
    neighbourhoodSlug: "gulshan",
    price: 50_000_000,
    bedrooms: 3,
    areaSqft: 2500,
    amenities: ["pool", "gym"],
  };
  const like = (overrides: Partial<RecommendationSubject>): RecommendationSubject => ({
    ...base,
    ...overrides,
  });

  it("never recommends the same listing or the other transaction type", () => {
    expect(similarityScore(base, base)).toBe(0);
    expect(similarityScore(base, like({ id: "b", listingType: "rent" }))).toBe(0);
  });

  it("weights the same neighbourhood above the same city", () => {
    const sameNeighbourhood = similarityScore(base, like({ id: "b" }));
    const sameCity = similarityScore(base, like({ id: "c", neighbourhoodSlug: "banani" }));
    expect(sameNeighbourhood).toBe(100);
    expect(sameNeighbourhood).toBeGreaterThan(sameCity);
  });

  it("ranks, filters and limits candidates", () => {
    const ranked = rankSimilar(
      base,
      [
        like({
          id: "far",
          citySlug: "sylhet",
          neighbourhoodSlug: "",
          propertyType: "villa",
          price: 5_000_000,
        }),
        like({ id: "close" }),
        like({ id: "rent", listingType: "rent" }),
        like({ id: "mid", neighbourhoodSlug: "banani" }),
      ],
      2,
    );
    expect(ranked.map((item) => item.id)).toEqual(["close", "mid"]);
  });
});
