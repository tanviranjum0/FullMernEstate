"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useState } from "react";
import { DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/section";
import { AMENITY_LABELS, type AmenityKey } from "@/config/property-options";
import { cn } from "@/lib/utils/cn";
import type { PropertyPreview } from "@/app/api/properties/[slug]/preview/route";
import { CompareButton, FavoriteButton } from "./card-actions";
import { PriceTag, SpecsInline, locationLine } from "./property-meta";

type LoadState = { status: "idle" | "loading" } | { status: "error" } | { status: "ready"; data: PropertyPreview };

export function QuickViewButton({ slug, title, className }: { slug: string; title: string; className?: string }) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [activeImage, setActiveImage] = useState(0);

  const load = async () => {
    if (state.status === "ready" || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(slug)}/preview`);
      if (!response.ok) throw new Error(String(response.status));
      setState({ status: "ready", data: (await response.json()) as PropertyPreview });
    } catch {
      setState({ status: "error" });
    }
  };

  return (
    <DialogRoot onOpenChange={(open) => open && void load()}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "light", size: "sm" }),
          "gap-2 shadow-lift",
          className,
        )}
        aria-label={`Quick view: ${title}`}
      >
        <Eye strokeWidth={1.5} />
        Quick view
      </DialogTrigger>
      <DialogContent title={title} hideTitle className="w-[min(100vw-2rem,60rem)] p-0 sm:p-0">
        {state.status === "ready" ? (
          <div className="grid md:grid-cols-[1.25fr_1fr]">
            <div className="flex flex-col gap-2 bg-ink-950 p-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                {state.data.images[activeImage] ? (
                  <Image
                    src={state.data.images[activeImage].src}
                    alt={state.data.images[activeImage].alt}
                    fill
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {state.data.images.slice(0, 5).map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === activeImage}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden opacity-60 transition-opacity hover:opacity-100",
                      index === activeImage && "opacity-100 outline outline-1 outline-ivory",
                    )}
                  >
                    <Image src={image.src} alt="" fill sizes="120px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <p className="eyebrow text-stone-600">{locationLine(state.data)}</p>
              <h2 className="mt-3 font-display text-heading-3 text-ink-900">{state.data.title}</h2>
              {state.data.headline ? <p className="mt-3 text-stone-600">{state.data.headline}</p> : null}
              <PriceTag price={state.data.price} listingType={state.data.listingType} className="mt-6" />
              <SpecsInline
                bedrooms={state.data.bedrooms}
                bathrooms={state.data.bathrooms}
                areaSqft={state.data.areaSqft}
                className="mt-3"
              />
              {state.data.amenities.length ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {state.data.amenities.slice(0, 6).map((amenity) => (
                    <li key={amenity} className="rounded-xs bg-sand-100 px-2.5 py-1 text-xs text-stone-700">
                      {AMENITY_LABELS[amenity as AmenityKey] ?? amenity}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 pt-8">
                <Link href={`/properties/${state.data.slug}`} className={buttonVariants({ variant: "primary" })}>
                  View residence
                </Link>
                <FavoriteButton propertyId={state.data.id} title={state.data.title} variant="inline" />
                <CompareButton propertyId={state.data.id} title={state.data.title} variant="inline" />
              </div>
            </div>
          </div>
        ) : state.status === "error" ? (
          <div className="p-8 text-center">
            <p className="text-stone-700">This preview could not be loaded.</p>
            <Link href={`/properties/${slug}`} className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
              Open the full listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 p-2 md:grid-cols-[1.25fr_1fr]" aria-busy="true" aria-label="Loading preview">
            <Skeleton className="aspect-[4/3]" />
            <div className="space-y-4 p-6">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </div>
        )}
      </DialogContent>
    </DialogRoot>
  );
}
