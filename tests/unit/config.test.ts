import { describe, expect, it } from "vitest";
import { normalizeOrigin } from "@/config/site";

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
