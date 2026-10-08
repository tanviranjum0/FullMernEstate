import type { Metadata } from "next";
import { Suspense } from "react";
import { PropertyForm } from "@/components/admin/property-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/auth/permissions";
import { emptyPropertyInput, getAdminOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "New listing" };

async function NewListing() {
  const user = await requireAdminPermission(
    ["properties:manage_all", "properties:manage_own"],
    "/admin/properties/new",
  );
  const options = await getAdminOptions();
  const initial = emptyPropertyInput(user);
  if (options.cities[0]) initial.location.citySlug = options.cities[0].slug;
  return (
    <>
      <AdminPageHeader
        title="New listing"
        back={{ href: "/admin/properties", label: "Listings" }}
      />
      <PropertyForm
        id={null}
        initial={initial}
        options={options}
        isAdmin={hasPermission(user.role, "properties:manage_all")}
        canPublish={hasPermission(user.role, "properties:publish")}
      />
    </>
  );
}

export default function NewListingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <NewListing />
    </Suspense>
  );
}
