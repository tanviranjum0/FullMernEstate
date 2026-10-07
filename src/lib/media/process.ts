import sharp, { type Metadata } from "sharp";
import { widthsForSource } from "./variants";

export const ACCEPTED_IMAGE_FORMATS = ["jpeg", "png", "webp", "avif", "heif"] as const;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_INPUT_PIXELS = 100_000_000;

export class ImageValidationError extends Error {}

export interface ProcessedVariant {
  width: number;
  height: number;
  buffer: Buffer;
}

export interface ProcessedImage {
  width: number;
  height: number;
  blurDataURL: string;
  variants: ProcessedVariant[];
}

/**
 * Validates an upload by decoding it (never by trusting the extension or MIME type), corrects
 * orientation, strips all metadata including GPS EXIF, and produces responsive WebP variants
 * plus a tiny blurred placeholder.
 */
export async function processImage(input: Buffer, { quality = 80 }: { quality?: number } = {}): Promise<ProcessedImage> {
  let metadata: Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new ImageValidationError("The file is not a readable image.");
  }
  if (!metadata.format || !(ACCEPTED_IMAGE_FORMATS as readonly string[]).includes(metadata.format)) {
    throw new ImageValidationError("Only JPEG, PNG, WebP, AVIF and HEIC images are accepted.");
  }

  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).autoOrient();
  const oriented = await base.clone().toBuffer({ resolveWithObject: true });
  const sourceWidth = oriented.info.width;
  const sourceHeight = oriented.info.height;
  if (sourceWidth < 320 || sourceHeight < 200) {
    throw new ImageValidationError("Images must be at least 320 × 200 pixels.");
  }

  const variants: ProcessedVariant[] = [];
  for (const width of widthsForSource(sourceWidth)) {
    const { data, info } = await sharp(oriented.data)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 4, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    variants.push({ width: info.width, height: info.height, buffer: data });
  }

  const blur = await sharp(oriented.data).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  const largest = variants[variants.length - 1]!;

  return {
    width: largest.width,
    height: largest.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    variants,
  };
}
