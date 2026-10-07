import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LocationDetailView } from "@/components/content/location-detail-view";
import { Skeleton } from "@/components/ui/section";
import { ogImage } from "@/lib/seo/url";
import { getCities, getLocation, getNeighbourhoods } from "@/server/queries/content";

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.length ? cities.map((city) => ({ city: city.slug })) : [{ city: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/locations/[city]">): Promise<Metadata> {
  const { city } = await params;
  const location = await getLocation(city);
  if (!location) return { title: "Location not found", robots: { index: false, follow: true } };
  const title = location.seo.title || `Luxury homes in ${location.name}`;
  const description = location.seo.description || location.intro;
  return {
    title,
    description,
    alternates: { canonical: location.href },
    openGraph: { title, description, url: location.href, images: ogImage(location.heroImage) },
  };
}

async function CityContent({ params }: { params: PageProps<"/locations/[city]">["params"] }) {
  const { city } = await params;
  const [location, neighbourhoods] = await Promise.all([getLocation(city), getNeighbourhoods(city)]);
  if (!location) notFound();
  return <LocationDetailView location={location} city={null} neighbourhoods={neighbourhoods} />;
}

export default function CityPage({ params }: PageProps<"/locations/[city]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[70svh] w-full" />}>
      <CityContent params={params} />
    </Suspense>
  );
}
