import Image from "next/image";
import type { MediaImage } from "@/server/dto";
import { cn } from "@/lib/utils/cn";

interface ResponsiveImageProps {
  image: MediaImage | null;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  alt?: string;
  quality?: 70 | 80;
}

/** Fills its (positioned) parent; falls back to a quiet placeholder when there is no image. */
export function ResponsiveImage({
  image,
  sizes,
  className,
  imageClassName,
  priority = false,
  alt,
  quality = 80,
}: ResponsiveImageProps) {
  if (!image) {
    return (
      <div
        aria-hidden
        className={cn("absolute inset-0 bg-gradient-to-br from-sand-100 to-sand-200", className)}
      />
    );
  }
  return (
    <Image
      src={image.src}
      alt={alt ?? image.alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL || undefined}
      className={cn("object-cover", className, imageClassName)}
    />
  );
}
