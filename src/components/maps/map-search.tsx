"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { PriceTag } from "@/components/property/property-meta";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { MapPoint } from "@/server/search/property-search";
import { LazyMap } from "./lazy-map";

function markerLabel(point: MapPoint) {
  if (point.price.onRequest) return "POA";
  return formatPrice(point.price.amount, point.price.currency, { compact: true }).replace("BDT ", "৳");
}

/**
 * Split list/map search with synchronised hover state. The list is the accessible primary
 * representation; the map is an enhancement loaded on demand.
 */
export function MapSearch({ points }: { points: MapPoint[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("map");
  const listRef = useRef<HTMLUListElement>(null);
  const markers = useMemo(
    () => points.map((point) => ({ id: point.id, lat: point.lat, lng: point.lng, label: markerLabel(point), title: point.title })),
    [points],
  );

  const focusListItem = (id: string) => {
    setActiveId(id);
    listRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="relative grid h-[calc(100dvh-var(--header-h)-9rem)] min-h-[32rem] lg:grid-cols-[26rem_1fr]">
      <div className={cn("min-h-0 overflow-y-auto border-r border-sand-200", mobileView === "map" && "hidden lg:block")}>
        <p className="sticky top-0 z-10 border-b border-sand-200 bg-ivory/95 px-5 py-3 text-sm text-stone-600 backdrop-blur-sm">
          <span className="font-semibold text-ink-900 tabular">{points.length}</span> residences on the map
        </p>
        <ul ref={listRef} className="divide-y divide-sand-200">
          {points.map((point) => (
            <li key={point.id} data-id={point.id}>
              <Link
                href={`/properties/${point.slug}`}
                onMouseEnter={() => setActiveId(point.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(point.id)}
                className={cn(
                  "flex gap-4 p-4 transition-colors hover:bg-sand-100",
                  activeId === point.id && "bg-sand-100",
                )}
              >
                <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden bg-sand-100">
                  {point.image ? <Image src={point.image.src} alt="" fill sizes="128px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl leading-tight text-ink-900">{point.title}</p>
                  <PriceTag price={point.price} listingType={point.listingType} className="mt-1 [&>span:first-child]:text-lg" showPrevious={false} />
                  <p className="mt-1 text-xs text-stone-600">
                    {point.bedrooms ? `${point.bedrooms} beds` : null}
                    {point.bedrooms && point.areaSqft ? " · " : null}
                    {point.areaSqft ? `${formatNumber(point.areaSqft)} sq ft` : null}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("relative min-h-0", mobileView === "list" && "hidden lg:block")}>
        <LazyMap
          eager
          className="h-full w-full"
          markers={markers}
          highlightedId={activeId}
          onMarkerHover={setActiveId}
          onMarkerClick={focusListItem}
          ariaLabel="Map of matching residences. The list of results provides the same information."
        />
      </div>
      <button
        type="button"
        onClick={() => setMobileView((view) => (view === "map" ? "list" : "map"))}
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-[0.72rem] font-semibold tracking-[0.12em] text-ivory uppercase shadow-float lg:hidden"
      >
        {mobileView === "map" ? (
          <>
            <List strokeWidth={1.5} className="size-4" /> Show list
          </>
        ) : (
          <>
            <MapIcon strokeWidth={1.5} className="size-4" /> Show map
          </>
        )}
      </button>
    </div>
  );
}
