import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { cn } from "@/lib/utils/cn";
import type { LocationSummary } from "@/server/dto";

export function LocationCard({
  location,
  count,
  className,
  aspect = "aspect-[3/4]",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw",
}: {
  location: LocationSummary;
  count?: number;
  className?: string;
  aspect?: string;
  sizes?: string;
}) {
  return (
    <Link
      href={location.href}
      className={cn(
        "group relative isolate block overflow-hidden bg-ink-900 text-ivory",
        aspect,
        className,
      )}
    >
      <ResponsiveImage
        image={location.heroImage}
        alt=""
        sizes={sizes}
        className="-z-10 opacity-90 transition-[transform,opacity] duration-[1600ms] ease-luxe group-hover:scale-[1.05] group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent"
      />
      <div className="flex h-full flex-col justify-end p-6">
        {count !== undefined ? (
          <p className="eyebrow mb-3 text-ivory/75">
            {count} {count === 1 ? "residence" : "residences"}
          </p>
        ) : null}
        <div className="flex items-end justify-between gap-4">
          <h3 className="font-display text-[2rem] leading-none">{location.name}</h3>
          <ArrowUpRight
            aria-hidden
            strokeWidth={1.25}
            className="size-6 shrink-0 translate-y-1 opacity-70 transition-transform duration-500 ease-luxe group-hover:translate-x-1 group-hover:-translate-y-0 group-hover:opacity-100"
          />
        </div>
        {location.headline ? (
          <p className="mt-3 line-clamp-2 text-sm text-ivory/80">{location.headline}</p>
        ) : null}
      </div>
    </Link>
  );
}
