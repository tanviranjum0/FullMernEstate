import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PropertyRowActions } from "@/components/admin/row-actions";
import { AdminPageHeader, DataTable, FilterForm, Pill, STATUS_TONES, filterInput, pageHref, readPage, readParam, td, th } from "@/components/admin/ui";
import { adminButton } from "@/components/admin/form-kit";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/section";
import { AVAILABILITY_LABELS, PROPERTY_TYPE_LABELS, type AvailabilityStatus, type PropertyType } from "@/config/property-options";
import { requireAdminPermission } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/auth/permissions";
import { formatDate, formatPrice } from "@/lib/format";
import { listAdminProperties } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Listings" };

async function Listings({ searchParams }: { searchParams: PageProps<"/admin/properties">["searchParams"] }) {
  const user = await requireAdminPermission(["properties:manage_all", "properties:manage_own"], "/admin/properties");
  const params = await searchParams;
  const filters = { q: readParam(params.q), status: readParam(params.status), listing: readParam(params.listing) };
  const result = await listAdminProperties(user, { ...filters, page: readPage(params.page) });
  const canDelete = hasPermission(user.role, "properties:manage_all");

  return (
    <>
      <AdminPageHeader
        title="Listings"
        description={`${result.total} ${result.total === 1 ? "listing" : "listings"}${canDelete ? "" : " assigned to you"}`}
        actions={
          <Link href="/admin/properties/new" className={adminButton.primary}>
            <Plus aria-hidden className="size-4" /> New listing
          </Link>
        }
      />
      <FilterForm action="/admin/properties">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={filters.q} placeholder="Search title or area" className={`${filterInput} w-64`} />
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={filterInput}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <label className="sr-only" htmlFor="listing">Transaction</label>
        <select id="listing" name="listing" defaultValue={filters.listing ?? ""} className={filterInput}>
          <option value="">Sale & rent</option>
          <option value="sale">For sale</option>
          <option value="rent">To rent</option>
        </select>
      </FilterForm>
      <DataTable caption="Listings">
        <thead>
          <tr>
            <th scope="col" className={th}>Listing</th>
            <th scope="col" className={th}>Price</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Availability</th>
            <th scope="col" className={th}>Advisor</th>
            <th scope="col" className={th}>Updated</th>
            <th scope="col" className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {result.items.length === 0 ? (
            <tr>
              <td colSpan={7} className={`${td} py-12 text-center text-stone-600`}>
                No listings match these filters.
              </td>
            </tr>
          ) : (
            result.items.map((row) => (
              <tr key={row.id} className="hover:bg-sand-100/40">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-xs bg-sand-100">
                      {row.image ? <Image src={row.image} alt="" fill sizes="64px" className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/properties/${row.id}`} className="font-medium text-ink-900 hover:underline">
                        {row.title}
                      </Link>
                      <p className="truncate text-xs text-stone-600">
                        {PROPERTY_TYPE_LABELS[row.propertyType as PropertyType]} · {row.location}
                        {row.featured ? " · Featured" : ""}
                        {row.exclusive ? " · Exclusive" : ""}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap tabular`}>
                  {row.onRequest ? "On request" : formatPrice(row.price, row.currency, { compact: true, period: row.listingType === "rent" ? "month" : null })}
                </td>
                <td className={td}>
                  <Pill tone={STATUS_TONES[row.status]}>{row.status}</Pill>
                </td>
                <td className={td}>
                  <Pill tone={STATUS_TONES[row.availability]}>{AVAILABILITY_LABELS[row.availability as AvailabilityStatus]}</Pill>
                </td>
                <td className={`${td} text-stone-700`}>{row.agentName || "—"}</td>
                <td className={`${td} whitespace-nowrap text-stone-600`}>{formatDate(row.updatedAt)}</td>
                <td className={`${td} text-right`}>
                  <PropertyRowActions id={row.id} title={row.title} status={row.status} canDelete={canDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
      <Pagination className="mt-6" page={result.page} pageCount={result.pageCount} hrefForPage={(page) => pageHref("/admin/properties", filters, page)} />
    </>
  );
}

export default function AdminPropertiesPage({ searchParams }: PageProps<"/admin/properties">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Listings searchParams={searchParams} />
    </Suspense>
  );
}
