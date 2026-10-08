import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader, DataTable, FilterForm, filterInput, pageHref, readPage, readParam, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/section";
import { ROLE_LABELS } from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { isUserRole } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";
import { listAuditLog } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Audit log" };

const ENTITY_TYPES = [
  ["property", "Listings"],
  ["inquiry", "Enquiries"],
  ["agent", "Advisors"],
  ["location", "Locations"],
  ["article", "Insights"],
  ["user", "Users"],
  ["settings", "Site settings"],
  ["media", "Media"],
] as const;

async function AuditLog({ searchParams }: { searchParams: PageProps<"/admin/audit-log">["searchParams"] }) {
  await requireAdminPermission("audit:read", "/admin/audit-log");
  const params = await searchParams;
  const requested = readParam(params.entity);
  const entity = ENTITY_TYPES.some(([value]) => value === requested) ? requested : undefined;
  const result = await listAuditLog({ entityType: entity, page: readPage(params.page) });
  return (
    <>
      <AdminPageHeader title="Audit log" description="Every administrative change, newest first. Entries cannot be edited or removed from this interface." />
      <FilterForm action="/admin/audit-log">
        <label className="sr-only" htmlFor="entity">Area</label>
        <select id="entity" name="entity" defaultValue={entity ?? ""} className={filterInput}>
          <option value="">All areas</option>
          {ENTITY_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FilterForm>
      <DataTable caption="Audit log entries">
        <thead>
          <tr>
            <th scope="col" className={th}>When</th>
            <th scope="col" className={th}>Who</th>
            <th scope="col" className={th}>Action</th>
            <th scope="col" className={th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {result.items.length ? (
            result.items.map((row) => (
              <tr key={row.id}>
                <td className={`${td} whitespace-nowrap text-stone-600`}>{formatDateTime(row.createdAt)}</td>
                <td className={td}>
                  <p className="text-ink-900">{row.actor || "System"}</p>
                  {isUserRole(row.role) ? <p className="text-xs text-stone-500">{ROLE_LABELS[row.role]}</p> : null}
                </td>
                <td className={`${td} font-mono text-xs text-stone-700`}>{row.action}</td>
                <td className={`${td} text-stone-700`}>{row.summary}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className={`${td} py-10 text-center text-stone-600`}>
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
      <Pagination className="mt-6" page={result.page} pageCount={result.pageCount} hrefForPage={(page) => pageHref("/admin/audit-log", { entity }, page)} />
    </>
  );
}

export default function AdminAuditLogPage({ searchParams }: PageProps<"/admin/audit-log">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuditLog searchParams={searchParams} />
    </Suspense>
  );
}
