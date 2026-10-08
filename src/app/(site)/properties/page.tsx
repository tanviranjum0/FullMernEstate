import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SearchControls } from "@/components/search/search-controls";
import { SearchResults, SearchResultsSkeleton } from "@/components/search/search-results";
import { Skeleton } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import { describeSearch } from "@/lib/search/describe";
import { getSearchIndexability, parseSearchParams } from "@/lib/search/params";
import { getLocationOptions } from "@/server/queries/location-names";

export async function generateMetadata({
  searchParams,
}: PageProps<"/properties">): Promise<Metadata> {
  const query = parseSearchParams(await searchParams);
  const { names } = await getLocationOptions();
  const title = describeSearch(query, names);
  const { indexable, canonicalPath } = getSearchIndexability(query);
  const description = `${title}, presented by ${siteConfig.name} with detailed photography, floor areas and pricing.`;
  return {
    title: query.page > 1 ? `${title} — page ${query.page}` : title,
    description,
    alternates: { canonical: canonicalPath },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: canonicalPath },
  };
}

async function SearchHeading({
  searchParams,
}: {
  searchParams: PageProps<"/properties">["searchParams"];
}) {
  const query = parseSearchParams(await searchParams);
  const { names } = await getLocationOptions();
  return (
    <h1 className="mt-5 font-display text-heading-1 text-ink-900">
      {describeSearch(query, names)}
    </h1>
  );
}

async function Controls({
  searchParams,
}: {
  searchParams: PageProps<"/properties">["searchParams"];
}) {
  const query = parseSearchParams(await searchParams);
  const { options } = await getLocationOptions();
  return <SearchControls key={JSON.stringify(query)} query={query} locations={options} />;
}

async function Results({
  searchParams,
}: {
  searchParams: PageProps<"/properties">["searchParams"];
}) {
  const query = parseSearchParams(await searchParams);
  const { names } = await getLocationOptions();
  return <SearchResults query={query} names={names} />;
}

export default function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  return (
    <div className="container-page pt-10 pb-[var(--section-y)] sm:pt-14">
      <Breadcrumbs items={[{ label: "Properties", href: "/properties" }]} />
      <Suspense
        fallback={<h1 className="mt-5 font-display text-heading-1 text-ink-900">Residences</h1>}
      >
        <SearchHeading searchParams={searchParams} />
      </Suspense>
      <div className="sticky top-[var(--header-h)] z-30 -mx-[var(--gutter)] mt-8 border-y border-sand-200 bg-ivory/95 px-[var(--gutter)] py-3 backdrop-blur-md">
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <Controls searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
