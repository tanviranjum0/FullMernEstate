"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { recentlyViewedList } from "@/components/property/client-stores";
import { PriceTag, locationLine } from "@/components/property/property-meta";
import type { PropertyCard } from "@/server/dto";

/** Shown only to returning visitors who have viewed homes on this device. */
export function RecentlyViewedStrip({ excludeId }: { excludeId?: string }) {
  const ids = recentlyViewedList.useList();
  const [cards, setCards] = useState<PropertyCard[]>([]);
  const key = ids.filter((id) => id !== excludeId).slice(0, 6).join(",");

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/properties/cards?ids=${key}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: PropertyCard[]) => setCards(data))
      .catch(() => undefined);
    return () => controller.abort();
  }, [key]);

  if (!key || cards.length === 0) return null;
  return (
    <section aria-labelledby="recent-heading" className="container-page pb-[var(--section-y)]">
      <div className="flex items-baseline justify-between gap-4 border-t border-sand-200 pt-10">
        <h2 id="recent-heading" className="font-display text-heading-3 text-ink-900">
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={() => recentlyViewedList.clear()}
          className="text-xs tracking-[0.14em] text-stone-600 uppercase underline-offset-4 hover:text-ink-900 hover:underline"
        >
          Clear
        </button>
      </div>
      <ul className="scrollbar-none mt-8 flex snap-x gap-5 overflow-x-auto pb-2">
        {cards.map((card) => (
          <li key={card.id} className="w-64 shrink-0 snap-start">
            <Link href={`/properties/${card.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                {card.image ? (
                  <Image
                    src={card.image.src}
                    alt=""
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <p className="eyebrow mt-3 text-stone-600">{locationLine(card)}</p>
              <p className="mt-1 font-display text-xl leading-tight text-ink-900">{card.title}</p>
              <PriceTag price={card.price} listingType={card.listingType} className="mt-2 [&>span:first-child]:text-lg" showPrevious={false} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
