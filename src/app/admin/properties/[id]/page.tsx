import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PropertyForm } from "@/components/admin/property-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminOptions, getAdminProperty } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Edit listing" };

async function EditListing({ params }: { params: PageProps<"/admin/properties/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireAdminPermission(
    ["properties:manage_all", "properties:manage_own"],
    `/admin/properties/${id}`,
  );
  const [property, options] = await Promise.all([getAdminProperty(user, id), getAdminOptions()]);
  // Missing and not-yours are indistinguishable to the requester.
  if (!property) notFound();
  return (
    <>
      <AdminPageHeader
        title={property.input.title}
        description={`/properties/${property.slug}`}
        back={{ href: "/admin/properties", label: "Listings" }}
      />
      <PropertyForm
        key={id}
        id={id}
        initial={property.input}
        options={options}
        isAdmin={hasPermission(user.role, "properties:manage_all")}
        canPublish={hasPermission(user.role, "properties:publish")}
      />
    </>
  );
}

export default function EditListingPage({ params }: PageProps<"/admin/properties/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <EditListing params={params} />
    </Suspense>
  );
}
