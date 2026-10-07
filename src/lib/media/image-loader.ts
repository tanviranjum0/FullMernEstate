import type { ImageLoaderProps } from "next/image";
import { parseVariantSrc, pickVariantWidth, variantFileName } from "./variants";

/**
 * Serves pre-generated variants for our own media and uses provider-side resizing for known
 * image CDNs, so responsive images never depend on a per-request transformation budget.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const variant = parseVariantSrc(src);
  if (variant) {
    return `${variant.base}/${variantFileName(pickVariantWidth(width, variant.maxWidth))}`;
  }

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }

  if (src.startsWith("https://res.cloudinary.com/") && src.includes("/upload/")) {
    return src.replace("/upload/", `/upload/c_limit,w_${width},q_auto,f_auto/`);
  }

  return src;
}
