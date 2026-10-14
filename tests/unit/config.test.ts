import { describe, expect, it } from "vitest";
import { normalizeOrigin, resolveSiteUrl } from "@/config/site";

describe("normalizeOrigin", () => {
  it("adds https to bare domains and strips paths and trailing slashes", () => {
    expect(normalizeOrigin("estate.tanvirdev.site")).toBe("https://estate.tanvirdev.site");
    expect(normalizeOrigin(" https://estate.tanvirdev.site/ ")).toBe(
      "https://estate.tanvirdev.site",
    );
    expect(normalizeOrigin("https://example.com/some/path")).toBe("https://example.com");
  });

  it("keeps http for local development hosts and explicit schemes", () => {
    expect(normalizeOrigin("localhost:3000")).toBe("http://localhost:3000");
    expect(normalizeOrigin("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizeOrigin("http://staging.example.com")).toBe("http://staging.example.com");
  });

  it("rejects values that are not hosts", () => {
    expect(() => normalizeOrigin("not a url")).toThrow();
  });
});

describe("resolveSiteUrl", () => {
  it("uses localhost only outside production when no public origin is configured", () => {
    expect(resolveSiteUrl({ production: false })).toBe("http://localhost:3000");
  });

  it("normalizes an explicitly configured production origin", () => {
    expect(
      resolveSiteUrl({
        siteUrl: "https://estate.example.com/some/path/",
        production: true,
      }),
    ).toBe("https://estate.example.com");
  });

  it("uses Vercel's production hostname when no explicit origin is configured", () => {
    expect(
      resolveSiteUrl({
        vercelProductionUrl: "estate.example.com",
        production: true,
      }),
    ).toBe("https://estate.example.com");
  });

  it("fails production configuration when there is no public origin", () => {
    expect(() => resolveSiteUrl({ production: true })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it.each(["http://estate.example.com", "https://localhost:3000", "https://127.0.0.1"])(
    "rejects non-public production origin %s",
    (siteUrl) => {
      expect(() => resolveSiteUrl({ siteUrl, production: true })).toThrow(/public HTTPS origin/);
    },
  );
});
