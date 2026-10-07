/**
 * Every uploaded image is stored as a set of pre-sized WebP variants named `w{width}.webp`
 * inside its own folder. The stored `src` always points at the largest variant, whose width is
 * encoded in the file name, so the image loader can pick a smaller sibling without a lookup.
 */
export const VARIANT_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;

const VARIANT_PATTERN = /\/w(\d{2,5})\.webp$/;

export function variantFileName(width: number): string {
  return `w${width}.webp`;
}

export function parseVariantSrc(src: string): { base: string; maxWidth: number } | null {
  const match = VARIANT_PATTERN.exec(src.split("?")[0] ?? src);
  if (!match?.[1]) return null;
  const maxWidth = Number(match[1]);
  const base = src.slice(0, src.lastIndexOf("/"));
  return { base, maxWidth };
}

export function pickVariantWidth(requested: number, maxWidth: number): number {
  const candidate = VARIANT_WIDTHS.find((width) => width >= requested);
  if (!candidate || candidate >= maxWidth) return maxWidth;
  return candidate;
}

/** Widths actually generated for a source image of the given intrinsic width. */
export function widthsForSource(sourceWidth: number): number[] {
  const maxVariant = VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1] ?? 2560;
  const top = Math.min(sourceWidth, maxVariant);
  const smaller = VARIANT_WIDTHS.filter((width) => width < top);
  return [...smaller, top];
}
