import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LocationDetailView } from "@/components/content/location-detail-view";
import { Skeleton } from "@/components/ui/section";
import { ogImage } from "@/lib/seo/url";
import { getLocation, getLocationTree } from "@/server/queries/content";

export async function generateStaticParams() {
  const tree = await getLocationTree();
  const params = tree.flatMap(({ city, neighbourhoods }) =>
    neighbourhoods.map((n) => ({ city: city.slug, neighbourhood: n.slug })),
  );
  return params.length ? params : [{ city: "__none__", neighbourhood: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/locations/[city]/[neighbourhood]">): Promise<Metadata> {
  const { city, neighbourhood } = await params;
  const [location, parent] = await Promise.all([getLocation(city, neighbourhood), getLocation(city)]);
  if (!location || !parent) return { title: "Location not found", robots: { index: false, follow: true } };
  const title = location.seo.title || `Luxury homes in ${location.name}, ${parent.name}`;
  const description = location.seo.description || location.intro;
  return {
    title,
    description,
    alternates: { canonical: location.href },
    openGraph: { title, description, url: location.href, images: ogImage(location.heroImage) },
  };
}

async function NeighbourhoodContent({ params }: { params: PageProps<"/locations/[city]/[neighbourhood]">["params"] }) {
  const { city, neighbourhood } = await params;
  const [location, parent] = await Promise.all([getLocation(city, neighbourhood), getLocation(city)]);
  if (!location || !parent) notFound();
  return <LocationDetailView location={location} city={parent} neighbourhoods={[]} />;
}

export default function NeighbourhoodPage({ params }: PageProps<"/locations/[city]/[neighbourhood]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[70svh] w-full" />}>
      <NeighbourhoodContent params={params} />
    </Suspense>
  );
}
