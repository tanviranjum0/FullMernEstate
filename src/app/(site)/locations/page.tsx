import type { Metadata } from "next";
import Link from "next/link";
import { LocationCard } from "@/components/content/location-card";
import { PageIntro } from "@/components/layout/page-intro";
import { getLocationTree } from "@/server/queries/content";
import { getPropertyCountsByLocation } from "@/server/queries/properties";

export const metadata: Metadata = {
  title: "Locations",
  description:
    "Guides to the neighbourhoods we know best — from Gulshan, Banani and Baridhara in Dhaka to Chattogram's hills, the coast at Cox's Bazar and Sylhet's tea country.",
  alternates: { canonical: "/locations" },
};

export default async function LocationsPage() {
  const [tree, counts] = await Promise.all([getLocationTree(), getPropertyCountsByLocation()]);
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Locations", href: "/locations" }]}
        eyebrow="Where we work"
        title="Places worth calling home"
        lead="Each guide brings together the homes we represent, what daily life is like, and the questions buyers and tenants ask us most."
      />
      <div className="container-page space-y-24 pb-[var(--section-y)]">
        {tree.map(({ city, neighbourhoods }) => (
          <section
            key={city.id}
            aria-labelledby={`city-${city.slug}`}
            className="grid gap-10 lg:grid-cols-12"
          >
            <div className="lg:col-span-5">
              <LocationCard
                location={city}
                count={counts[city.slug] ?? 0}
                aspect="aspect-[4/5]"
                sizes="(min-width: 1024px) 40vw, 92vw"
              />
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-6">
              <h2 id={`city-${city.slug}`} className="font-display text-heading-1 text-ink-900">
                <Link href={city.href} className="hover:text-harbour-700">
                  {city.name}
                </Link>
              </h2>
              {city.intro ? <p className="mt-5 text-lead text-stone-600">{city.intro}</p> : null}
              {neighbourhoods.length ? (
                <ul className="mt-10 border-t border-sand-200">
                  {neighbourhoods.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        className="group flex items-baseline justify-between gap-4 border-b border-sand-200 py-5 transition-colors hover:text-harbour-700"
                      >
                        <span className="font-display text-[1.6rem] text-ink-900 group-hover:text-harbour-700">
                          {n.name}
                        </span>
                        <span className="tabular text-sm text-stone-600">
                          {counts[`${city.slug}/${n.slug}`] ?? 0} residences
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
