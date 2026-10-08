import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader, DataTable, FilterForm, Pill, STATUS_TONES, filterInput, pageHref, readPage, readParam, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/section";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, INQUIRY_TYPES, INQUIRY_TYPE_LABELS } from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/format";
import { listAdminInquiries } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Enquiries" };

async function Inquiries({ searchParams }: { searchParams: PageProps<"/admin/inquiries">["searchParams"] }) {
  const user = await requireAdminPermission(["inquiries:manage_all", "inquiries:manage_own"], "/admin/inquiries");
  const params = await searchParams;
  const filters = { q: readParam(params.q), status: readParam(params.status), type: readParam(params.type) };
  const result = await listAdminInquiries(user, { ...filters, page: readPage(params.page) });

  return (
    <>
      <AdminPageHeader title="Enquiries" description={`${result.total} matching enquiries`} />
      <FilterForm action="/admin/inquiries">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={filters.q} placeholder="Name, email or listing" className={`${filterInput} w-64`} />
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={filterInput}>
          <option value="">Any status</option>
          <option value="open">Open (not closed)</option>
          {INQUIRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {INQUIRY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={filters.type ?? ""} className={filterInput}>
          <option value="">Any type</option>
          {INQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {INQUIRY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </FilterForm>
      <DataTable caption="Enquiries">
        <thead>
          <tr>
            <th scope="col" className={th}>Received</th>
            <th scope="col" className={th}>From</th>
            <th scope="col" className={th}>Type</th>
            <th scope="col" className={th}>Listing</th>
            <th scope="col" className={th}>Assigned</th>
            <th scope="col" className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {result.items.length === 0 ? (
            <tr>
              <td colSpan={6} className={`${td} py-12 text-center text-stone-600`}>
                No enquiries match these filters.
              </td>
            </tr>
          ) : (
            result.items.map((row) => (
              <tr key={row.id} className="hover:bg-sand-100/40">
                <td className={`${td} whitespace-nowrap text-stone-600`}>{formatDateTime(row.createdAt)}</td>
                <td className={td}>
                  <Link href={`/admin/inquiries/${row.id}`} className="font-medium text-ink-900 hover:underline">
                    {row.name}
                  </Link>
                  <p className="text-xs text-stone-600">
                    {row.email} · Ref {row.reference}
                  </p>
                </td>
                <td className={`${td} text-stone-700`}>{INQUIRY_TYPE_LABELS[row.type]}</td>
                <td className={`${td} text-stone-700`}>{row.property || "—"}</td>
                <td className={`${td} text-stone-700`}>{row.assignedName || "—"}</td>
                <td className={td}>
                  <Pill tone={STATUS_TONES[row.status]}>{INQUIRY_STATUS_LABELS[row.status]}</Pill>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </DataTable>
      <Pagination className="mt-6" page={result.page} pageCount={result.pageCount} hrefForPage={(page) => pageHref("/admin/inquiries", filters, page)} />
    </>
  );
}

export default function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Inquiries searchParams={searchParams} />
    </Suspense>
  );
}
