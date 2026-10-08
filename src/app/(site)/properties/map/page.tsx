import type { Metadata } from "next";
import { Suspense } from "react";
import { MapSearch } from "@/components/maps/map-search";
import { SearchControls } from "@/components/search/search-controls";
import { Skeleton } from "@/components/ui/section";
import { parseSearchParams } from "@/lib/search/params";
import { getLocationOptions } from "@/server/queries/location-names";
import { getMapPoints } from "@/server/queries/properties";

export const metadata: Metadata = {
  title: "Map search",
  description: "Explore residences on the map.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/properties" },
};

async function MapContent({
  searchParams,
}: {
  searchParams: PageProps<"/properties/map">["searchParams"];
}) {
  const query = parseSearchParams(await searchParams);
  const [{ options }, points] = await Promise.all([getLocationOptions(), getMapPoints(query)]);
  return (
    <>
      <div className="border-b border-sand-200 px-[var(--gutter)] py-3">
        <SearchControls
          key={JSON.stringify(query)}
          query={query}
          locations={options}
          basePath="/properties/map"
          view="map"
        />
      </div>
      <MapSearch points={points} />
    </>
  );
}

export default function MapSearchPage({ searchParams }: PageProps<"/properties/map">) {
  return (
    <div>
      <h1 className="sr-only">Map search</h1>
      <Suspense fallback={<Skeleton className="h-[calc(100dvh-var(--header-h))] w-full" />}>
        <MapContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
