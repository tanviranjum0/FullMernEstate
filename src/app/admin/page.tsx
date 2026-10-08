import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { AdminPageHeader, Panel, Pill, STATUS_TONES } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { INQUIRY_STATUS_LABELS, INQUIRY_TYPE_LABELS } from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getDashboardData } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({
  label,
  value,
  href,
  note,
}: {
  label: string;
  value: number | string;
  href?: string;
  note?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium text-stone-600">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold tracking-tight text-ink-900">{value}</p>
      {note ? <p className="mt-1 text-xs text-stone-500">{note}</p> : null}
    </>
  );
  return (
    <div className="rounded-md border border-sand-200 bg-white">
      {href ? (
        <Link href={href} className="block p-5 transition-colors hover:bg-sand-100/50">
          {content}
        </Link>
      ) : (
        <div className="p-5">{content}</div>
      )}
    </div>
  );
}

const METRIC_LABELS: [string, string][] = [
  ["property_view", "Listing views"],
  ["inquiry", "Enquiries"],
  ["viewing_request", "Viewing requests"],
  ["favorite_add", "Homes saved"],
  ["saved_search", "Searches saved"],
  ["share", "Shares"],
  ["phone_click", "Call taps"],
  ["email_click", "Email taps"],
  ["whatsapp_click", "WhatsApp taps"],
];

async function Dashboard() {
  const user = await requireAdminPermission("dashboard:view", "/admin");
  const data = await getDashboardData(user);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Activity across the site in the last 30 days."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.canSeeProperties ? (
          <>
            <Stat
              label="Published listings"
              value={data.properties.published}
              href="/admin/properties?status=published"
              note={`${data.properties.total} in total`}
            />
            <Stat
              label="Drafts"
              value={data.properties.draft}
              href="/admin/properties?status=draft"
              note={`${data.properties.archived} archived`}
            />
          </>
        ) : null}
        {data.canSeeInquiries ? (
          <>
            <Stat
              label="New enquiries"
              value={data.inquiries.newCount}
              href="/admin/inquiries?status=new"
              note="Awaiting first response"
            />
            <Stat
              label="Enquiries (30 days)"
              value={data.inquiries.last30}
              href="/admin/inquiries"
            />
          </>
        ) : null}
        {data.users !== null ? (
          <Stat label="Registered users" value={data.users} href="/admin/users" />
        ) : null}
        <Stat label="Active advisors" value={data.agents} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {data.canSeeInquiries ? (
          <Panel title="Enquiries per day" description="All enquiry types, last 30 days (UTC)">
            <DailyBarChart data={data.inquiries.series} label="Enquiries per day, last 30 days" />
            {data.inquiries.byType.length ? (
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-sand-200 pt-4 text-sm">
                {data.inquiries.byType.map((row) => (
                  <li key={row.type} className="text-stone-700">
                    {INQUIRY_TYPE_LABELS[row.type]}:{" "}
                    <span className="tabular font-semibold text-ink-900">{row.count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>
        ) : null}

        {Object.keys(data.metrics).length || data.canSeeProperties ? (
          <Panel title="Engagement" description="Anonymous counts, last 30 days">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-2">
              {METRIC_LABELS.filter(([key]) => key in data.metrics || data.canSeeProperties).map(
                ([key, label]) => (
                  <div key={key}>
                    <dt className="text-xs text-stone-600">{label}</dt>
                    <dd className="tabular text-xl font-semibold text-ink-900">
                      {formatNumber(data.metrics[key] ?? 0)}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </Panel>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {data.canSeeInquiries ? (
          <Panel
            title="Latest enquiries"
            className="xl:col-span-2"
            actions={
              <Link href="/admin/inquiries" className="text-sm underline underline-offset-2">
                All
              </Link>
            }
          >
            {data.inquiries.recent.length ? (
              <ul className="divide-y divide-sand-200">
                {data.inquiries.recent.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-sand-100/40"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900">{row.name}</p>
                        <p className="truncate text-xs text-stone-600">
                          {INQUIRY_TYPE_LABELS[row.type]}
                          {row.property ? ` · ${row.property}` : ""} ·{" "}
                          {formatDateTime(row.createdAt)}
                        </p>
                      </div>
                      <Pill tone={STATUS_TONES[row.status]}>
                        {INQUIRY_STATUS_LABELS[row.status]}
                      </Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-600">No enquiries yet.</p>
            )}
          </Panel>
        ) : null}

        {data.topViewed.length ? (
          <Panel title="Most viewed listings">
            <ol className="space-y-2.5 text-sm">
              {data.topViewed.map((row, index) => (
                <li key={row.id} className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/admin/properties/${row.id}`}
                    className="min-w-0 truncate text-ink-900 hover:underline"
                  >
                    <span className="tabular mr-2 text-stone-500">{index + 1}.</span>
                    {row.title}
                  </Link>
                  <span className="tabular shrink-0 text-stone-600">{formatNumber(row.views)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        ) : null}
      </div>

      {data.activity.length ? (
        <Panel
          title="Recent activity"
          className="mt-6"
          actions={
            <Link href="/admin/audit-log" className="text-sm underline underline-offset-2">
              Audit log
            </Link>
          }
        >
          <ul className="divide-y divide-sand-200 text-sm">
            {data.activity.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="text-ink-900">{row.summary}</span>
                <span className="text-xs text-stone-500">
                  {row.actor} · {formatDateTime(row.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Dashboard />
    </Suspense>
  );
}
