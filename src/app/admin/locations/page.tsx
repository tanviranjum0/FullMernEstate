import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { adminButton } from "@/components/admin/form-kit";
import { AdminPageHeader, Panel, Pill } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminLocations } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Locations" };

async function Locations() {
  await requireAdminPermission("locations:manage", "/admin/locations");
  const cities = await listAdminLocations();
  return (
    <>
      <AdminPageHeader
        title="Locations"
        description="City and neighbourhood guides. Listings can only be placed in locations that exist here."
        actions={
          <Link href="/admin/locations/new" className={adminButton.primary}>
            <Plus aria-hidden className="size-4" /> New location
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {cities.map((city) => (
          <Panel
            key={city.id}
            title={city.name}
            actions={
              <span className="flex items-center gap-2">
                {city.published ? <Pill tone="green">Published</Pill> : <Pill tone="amber">Hidden</Pill>}
                <Link href={`/admin/locations/${city.id}`} className="text-sm underline underline-offset-2">
                  Edit
                </Link>
              </span>
            }
          >
            {city.neighbourhoods.length ? (
              <ul className="divide-y divide-sand-200 text-sm">
                {city.neighbourhoods.map((n) => (
                  <li key={n.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/locations/${n.id}`} className="text-ink-900 hover:underline">
                      {n.name}
                    </Link>
                    {n.published ? <Pill tone="green">Published</Pill> : <Pill tone="amber">Hidden</Pill>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-600">No neighbourhoods.</p>
            )}
          </Panel>
        ))}
      </div>
    </>
  );
}

export default function AdminLocationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Locations />
    </Suspense>
  );
}
