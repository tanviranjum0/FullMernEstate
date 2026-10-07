import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/section";
import { INQUIRY_STATUS_LABELS, INQUIRY_TYPE_LABELS } from "@/config/domain";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { getAccountCounts, getRecentlyViewed, getUserInquiries } from "@/server/services/account";

export const metadata: Metadata = { title: "Overview" };

async function Overview() {
  const user = await requireUser("/account");
  const [counts, recent, inquiries] = await Promise.all([
    getAccountCounts(user.id),
    getRecentlyViewed(user.id, 3),
    getUserInquiries(user.id, 4),
  ]);
  const stats = [
    { label: "Saved homes", value: counts.saved, href: "/account/saved" },
    { label: "Saved searches", value: counts.searches, href: "/account/searches" },
    { label: "Enquiries", value: counts.inquiries, href: "/account/enquiries" },
  ];
  return (
    <>
      <h1 className="font-display text-heading-1 text-ink-900">Welcome, {user.name.split(" ")[0]}</h1>
      <ul className="mt-10 grid gap-px border border-sand-200 bg-sand-200 sm:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label} className="bg-ivory">
            <Link href={stat.href} className="block p-6 transition-colors hover:bg-paper">
              <span className="font-display text-[2.6rem] leading-none text-ink-900 tabular">{stat.value}</span>
              <span className="mt-2 block text-sm text-stone-600">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-account" className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-account" className="font-display text-heading-3 text-ink-900">
            Recently viewed
          </h2>
          <Link href="/properties" className="text-sm text-stone-600 underline underline-offset-4 hover:text-ink-900">
            Continue browsing
          </Link>
        </div>
        {recent.length ? (
          <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((property) => (
              <li key={property.id}>
                <PropertyCard property={property} aspect="aspect-[4/3]" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-stone-600">Homes you view while signed in will appear here.</p>
        )}
      </section>

      <section aria-labelledby="inquiries-account" className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="inquiries-account" className="font-display text-heading-3 text-ink-900">
            Latest enquiries
          </h2>
          <Link href="/account/enquiries" className="text-sm text-stone-600 underline underline-offset-4 hover:text-ink-900">
            View all
          </Link>
        </div>
        {inquiries.length ? (
          <ul className="mt-6 divide-y divide-sand-200 border-y border-sand-200">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-ink-900">{inquiry.propertyTitle || INQUIRY_TYPE_LABELS[inquiry.type]}</p>
                  <p className="text-sm text-stone-600">
                    {INQUIRY_TYPE_LABELS[inquiry.type]} · {formatDate(inquiry.createdAt)} · Ref {inquiry.reference}
                  </p>
                </div>
                <Badge tone="outline">{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6">
            <p className="text-stone-600">You have not sent any enquiries yet.</p>
            <ButtonLink href="/contact" variant="outline" size="sm" className="mt-4">
              Contact an advisor
            </ButtonLink>
          </div>
        )}
      </section>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Overview />
    </Suspense>
  );
}
