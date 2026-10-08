import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader, DataTable, FilterForm, Pill, filterInput, pageHref, readPage, readParam, td, th } from "@/components/admin/ui";
import { UserControls } from "@/components/admin/user-controls";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/section";
import { ROLE_LABELS, USER_ROLES } from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { formatDate } from "@/lib/format";
import { listAdminUsers } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Users" };

async function Users({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  const actor = await requireAdminPermission("users:manage", "/admin/users");
  const params = await searchParams;
  const filters = { q: readParam(params.q), role: readParam(params.role) };
  const result = await listAdminUsers({ ...filters, page: readPage(params.page) });
  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Accounts are created by visitors on the sign-up page. Change a role to grant staff access; advisors are linked from their advisor profile."
      />
      <FilterForm action="/admin/users">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={filters.q} placeholder="Name or email" className={`${filterInput} w-64`} />
        <label className="sr-only" htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue={filters.role ?? ""} className={filterInput}>
          <option value="">All roles</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </FilterForm>
      <p className="mb-3 text-sm text-stone-600">{result.total} accounts</p>
      <DataTable caption="User accounts">
        <thead>
          <tr>
            <th scope="col" className={th}>Account</th>
            <th scope="col" className={th}>Role</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Joined</th>
            <th scope="col" className={`${th} text-right`}>Manage</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((row) => (
            <tr key={row.id} className="hover:bg-sand-100/40">
              <td className={td}>
                <p className="font-medium text-ink-900">{row.name || "—"}</p>
                <p className="text-xs text-stone-600">{row.email}</p>
              </td>
              <td className={td}>
                <Pill tone={row.role === "admin" ? "dark" : row.role === "user" ? "neutral" : "blue"}>{ROLE_LABELS[row.role]}</Pill>
              </td>
              <td className={td}>{row.disabled ? <Pill tone="red">Disabled</Pill> : <Pill tone="green">Active</Pill>}</td>
              <td className={`${td} text-stone-600`}>{row.createdAt ? formatDate(row.createdAt) : "—"}</td>
              <td className={`${td} text-right`}>
                <UserControls key={`${row.role}-${row.disabled}`} id={row.id} email={row.email} role={row.role} disabled={row.disabled} isSelf={row.id === actor.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <Pagination className="mt-6" page={result.page} pageCount={result.pageCount} hrefForPage={(page) => pageHref("/admin/users", filters, page)} />
    </>
  );
}

export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}
