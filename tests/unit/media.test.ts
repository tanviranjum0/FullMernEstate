import { describe, expect, it } from "vitest";
import imageLoader from "@/lib/media/image-loader";
import { parseVariantSrc, pickVariantWidth, widthsForSource } from "@/lib/media/variants";

describe("image variants", () => {
  it("generates widths up to the source size without upscaling", () => {
    expect(widthsForSource(4000)).toEqual([320, 640, 960, 1280, 1920, 2560]);
    expect(widthsForSource(1920)).toEqual([320, 640, 960, 1280, 1920]);
    expect(widthsForSource(1000)).toEqual([320, 640, 960, 1000]);
  });

  it("parses the largest variant from a stored src", () => {
    expect(parseVariantSrc("/media/property/abc/w1920.webp")).toEqual({ base: "/media/property/abc", maxWidth: 1920 });
    expect(parseVariantSrc("https://x.public.blob.vercel-storage.com/property/abc/w2560.webp?v=1")?.maxWidth).toBe(2560);
    expect(parseVariantSrc("/images/photo.jpg")).toBeNull();
  });

  it("picks the smallest variant that covers the request", () => {
    expect(pickVariantWidth(600, 2560)).toBe(640);
    expect(pickVariantWidth(1300, 1920)).toBe(1920);
    expect(pickVariantWidth(3000, 1920)).toBe(1920);
    expect(pickVariantWidth(990, 1000)).toBe(1000);
  });
});

describe("imageLoader", () => {
  it("serves our own variants", () => {
    expect(imageLoader({ src: "/media/property/abc/w2560.webp", width: 640, quality: 75 })).toBe("/media/property/abc/w640.webp");
  });

  it("asks known CDNs to resize", () => {
    const unsplash = new URL(imageLoader({ src: "https://images.unsplash.com/photo-123", width: 960, quality: 70 }));
    expect(Object.fromEntries(unsplash.searchParams)).toEqual({ w: "960", q: "70", auto: "format", fit: "max" });
    expect(imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg", width: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_limit,w_640,q_auto,f_auto/v1/a.jpg",
    );
  });

  it("leaves other sources untouched", () => {
    expect(imageLoader({ src: "/icon.svg", width: 64 })).toBe("/icon.svg");
  });
});
