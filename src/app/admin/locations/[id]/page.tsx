import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LocationForm } from "@/components/admin/location-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { LocationInput } from "@/lib/validation/admin";
import { getAdminLocation, getAdminOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Location" };

const EMPTY_LOCATION: LocationInput = {
  kind: "neighbourhood",
  name: "",
  slug: "",
  parentSlug: "",
  headline: "",
  intro: "",
  body: "",
  heroImage: null,
  highlights: [],
  lifestyle: [],
  nearby: [],
  marketNotes: "",
  faqs: [],
  lat: undefined,
  lng: undefined,
  zoom: 13,
  published: false,
  sortOrder: 100,
  seo: { title: "", description: "" },
};

async function LocationEditor({ params }: { params: PageProps<"/admin/locations/[id]">["params"] }) {
  const { id } = await params;
  await requireAdminPermission("locations:manage", `/admin/locations/${id}`);
  const isNew = id === "new";
  const [location, options] = await Promise.all([isNew ? null : getAdminLocation(id), getAdminOptions()]);
  if (!isNew && !location) notFound();
  return (
    <>
      <AdminPageHeader
        title={isNew ? "New location" : location!.input.name}
        description={isNew ? undefined : location!.href}
        back={{ href: "/admin/locations", label: "Locations" }}
      />
      <LocationForm key={id} id={isNew ? null : id} initial={location?.input ?? EMPTY_LOCATION} options={options} />
    </>
  );
}

export default function AdminLocationPage({ params }: PageProps<"/admin/locations/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <LocationEditor params={params} />
    </Suspense>
  );
}
