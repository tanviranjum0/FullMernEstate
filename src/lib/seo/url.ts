import { siteConfig } from "@/config/site";
import { parseVariantSrc, pickVariantWidth, variantFileName } from "@/lib/media/variants";
import type { MediaImage } from "@/server/dto";

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, siteConfig.url).toString();
}

/** Social-card sized image URL (≈1200px wide) for Open Graph / Twitter metadata. */
export function ogImageUrl(image: Pick<MediaImage, "src">): string {
  if (image.src.startsWith("https://images.unsplash.com/")) {
    return `${image.src}?w=1200&h=630&fit=crop&q=80&auto=format`;
  }
  const variant = parseVariantSrc(image.src);
  if (variant) return absoluteUrl(`${variant.base}/${variantFileName(pickVariantWidth(1200, variant.maxWidth))}`);
  return absoluteUrl(image.src);
}

export function ogImage(image: MediaImage | null | undefined) {
  if (!image) return undefined;
  return [{ url: ogImageUrl(image), alt: image.alt }];
}
