import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BellPlus } from "lucide-react";
import { DeleteSavedSearchButton } from "@/components/account/delete-saved-search";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/section";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { getLocationOptions } from "@/server/queries/location-names";
import { getSavedSearches } from "@/server/services/account";

export const metadata: Metadata = { title: "Saved searches" };

async function Searches() {
  const user = await requireUser("/account/searches");
  const { names } = await getLocationOptions();
  const searches = await getSavedSearches(user.id, names);
  return (
    <>
      <h1 className="font-display text-heading-1 text-ink-900">Saved searches</h1>
      <p className="mt-3 max-w-xl text-stone-600">
        Return to a set of filters with one click. Email alerts for new matches are planned and will
        appear here when available.
      </p>
      {searches.length ? (
        <ul className="mt-10 divide-y divide-sand-200 border-y border-sand-200">
          {searches.map((search) => (
            <li key={search.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="min-w-0">
                <Link
                  href={search.query ? `/properties?${search.query}` : "/properties"}
                  className="font-display text-2xl text-ink-900 hover:text-harbour-700"
                >
                  {search.name}
                </Link>
                <p className="mt-1 text-sm text-stone-600">
                  {search.description} · saved {formatDate(search.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <ButtonLink
                  href={search.query ? `/properties?${search.query}` : "/properties"}
                  variant="outline"
                  size="sm"
                >
                  View results
                </ButtonLink>
                <DeleteSavedSearchButton id={search.id} name={search.name} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-10"
          icon={<BellPlus strokeWidth={1.25} />}
          title="No saved searches yet"
          description="Set your filters on the search page and choose “Save search”."
          action={<ButtonLink href="/properties">Start a search</ButtonLink>}
        />
      )}
    </>
  );
}

export default function SearchesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Searches />
    </Suspense>
  );
}
