import Link from "next/link";
import { SearchX, X } from "lucide-react";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { PropertyCard } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, Skeleton } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import { activeFilterChips, describeSearch, type LocationNames } from "@/lib/search/describe";
import { searchHref, serializeSearchQuery, type PropertySearchQuery } from "@/lib/search/params";
import { searchProperties } from "@/server/queries/properties";
import { SaveSearchButton } from "./save-search-button";

export async function SearchResults({ query, names }: { query: PropertySearchQuery; names: LocationNames }) {
  const results = await searchProperties(query);
  const chips = activeFilterChips(query, names, siteConfig.defaultCurrency);
  const queryString = serializeSearchQuery(query, { includePage: false }).toString();

  return (
    <div>
      <TrackOnMount name="search" dedupeKey={queryString || "all"} />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-200 pb-5">
        <p className="text-sm text-stone-600" aria-live="polite">
          <span className="font-semibold text-ink-900 tabular">{results.total}</span>{" "}
          {results.total === 1 ? "residence" : "residences"}
          {results.pageCount > 1 ? (
            <>
              {" "}
              · page {results.page} of {results.pageCount}
            </>
          ) : null}
        </p>
        <SaveSearchButton queryString={queryString} suggestedName={describeSearch(query, names)} />
      </div>

      {chips.length ? (
        <ul className="mt-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Link
                href={searchHref({ ...query, ...chip.without, page: 1 })}
                scroll={false}
                className="group inline-flex h-8 items-center gap-2 rounded-full border border-sand-300 bg-paper pr-2.5 pl-3.5 text-[0.8rem] text-ink-800 transition-colors hover:border-ink-900"
                aria-label={`Remove filter: ${chip.label}`}
              >
                {chip.label}
                <X aria-hidden strokeWidth={1.5} className="size-3.5 text-stone-500 group-hover:text-ink-900" />
              </Link>
            </li>
          ))}
          <li>
            <Link href="/properties" scroll={false} className="px-2 text-[0.8rem] text-stone-600 underline underline-offset-4 hover:text-ink-900">
              Clear all
            </Link>
          </li>
        </ul>
      ) : null}

      {results.items.length ? (
        <>
          <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {results.items.map((property, index) => (
              <li key={property.id}>
                <PropertyCard property={property} priority={index < 3} headingLevel="h2" />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-20"
            page={results.page}
            pageCount={results.pageCount}
            hrefForPage={(page) => searchHref({ ...query, page })}
          />
        </>
      ) : (
        <EmptyState
          className="mt-10"
          icon={<SearchX strokeWidth={1.25} />}
          title="No residences match these filters"
          description="Try widening your price range, choosing a different neighbourhood or removing a feature. You can also save this search to hear about new matches."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/properties" variant="outline">
                Clear filters
              </ButtonLink>
              <ButtonLink href="/contact?type=consultation">Ask an advisor</ButtonLink>
            </div>
          }
        />
      )}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading residences">
      <div className="flex items-center justify-between border-b border-sand-200 pb-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index}>
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mt-5 h-3 w-1/3" />
            <Skeleton className="mt-3 h-7 w-3/4" />
            <Skeleton className="mt-5 h-5 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
