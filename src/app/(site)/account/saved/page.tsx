import type { Metadata } from "next";
import { Suspense } from "react";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/section";
import { requireUser } from "@/lib/auth/session";
import { getSavedProperties } from "@/server/services/account";

export const metadata: Metadata = { title: "Saved homes" };

async function Saved() {
  const user = await requireUser("/account/saved");
  const properties = await getSavedProperties(user.id);
  return (
    <>
      <h1 className="font-display text-heading-1 text-ink-900">Saved homes</h1>
      <p className="mt-3 text-stone-600">
        {properties.length
          ? `${properties.length} ${properties.length === 1 ? "home" : "homes"} on your shortlist.`
          : null}
      </p>
      {properties.length ? (
        <ul className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} aspect="aspect-[4/3]" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-10"
          icon={<Heart strokeWidth={1.25} />}
          title="Your shortlist is empty"
          description="Tap the heart on any residence to save it here."
          action={<ButtonLink href="/properties">Browse residences</ButtonLink>}
        />
      )}
    </>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Saved />
    </Suspense>
  );
}
