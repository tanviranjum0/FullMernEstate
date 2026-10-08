import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { adminButton } from "@/components/admin/form-kit";
import { AdminPageHeader, DataTable, FilterForm, Pill, STATUS_TONES, filterInput, pageHref, readPage, readParam, td, th } from "@/components/admin/ui";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/section";
import { getArticleCategory } from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { formatDate } from "@/lib/format";
import { listAdminArticles } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Insights" };

async function Articles({ searchParams }: { searchParams: PageProps<"/admin/insights">["searchParams"] }) {
  await requireAdminPermission("content:manage", "/admin/insights");
  const params = await searchParams;
  const filters = { q: readParam(params.q), status: readParam(params.status) };
  const result = await listAdminArticles({ ...filters, page: readPage(params.page) });
  return (
    <>
      <AdminPageHeader
        title="Insights"
        description={`${result.total} articles`}
        actions={
          <Link href="/admin/insights/new" className={adminButton.primary}>
            <Plus aria-hidden className="size-4" /> New article
          </Link>
        }
      />
      <FilterForm action="/admin/insights">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={filters.q} placeholder="Search titles" className={`${filterInput} w-64`} />
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={filterInput}>
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </FilterForm>
      <DataTable caption="Articles">
        <thead>
          <tr>
            <th scope="col" className={th}>Title</th>
            <th scope="col" className={th}>Category</th>
            <th scope="col" className={th}>Status</th>
            <th scope="col" className={th}>Published</th>
            <th scope="col" className={th}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((row) => (
            <tr key={row.id} className="hover:bg-sand-100/40">
              <td className={td}>
                <Link href={`/admin/insights/${row.id}`} className="font-medium text-ink-900 hover:underline">
                  {row.title}
                </Link>
                {row.featured ? <span className="ml-2 text-xs text-stone-500">Featured</span> : null}
              </td>
              <td className={`${td} text-stone-700`}>{getArticleCategory(row.category)?.name ?? row.category}</td>
              <td className={td}>
                <Pill tone={STATUS_TONES[row.status]}>{row.status}</Pill>
              </td>
              <td className={`${td} text-stone-600`}>{row.publishedAt ? formatDate(row.publishedAt) : "—"}</td>
              <td className={`${td} text-stone-600`}>{formatDate(row.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <Pagination className="mt-6" page={result.page} pageCount={result.pageCount} hrefForPage={(page) => pageHref("/admin/insights", filters, page)} />
    </>
  );
}

export default function AdminInsightsPage({ searchParams }: PageProps<"/admin/insights">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Articles searchParams={searchParams} />
    </Suspense>
  );
}
