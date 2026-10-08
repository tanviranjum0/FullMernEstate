import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/section";
import { INQUIRY_STATUS_LABELS, INQUIRY_TYPE_LABELS } from "@/config/domain";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { getUserInquiries } from "@/server/services/account";

export const metadata: Metadata = { title: "Enquiries & viewings" };

async function Enquiries() {
  const user = await requireUser("/account/enquiries");
  const inquiries = await getUserInquiries(user.id);
  return (
    <>
      <h1 className="font-display text-heading-1 text-ink-900">Enquiries & viewings</h1>
      <p className="mt-3 text-stone-600">
        Enquiries you send while signed in are listed here with their current status.
      </p>
      {inquiries.length ? (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Your enquiries</caption>
            <thead>
              <tr className="border-b border-ink-900 text-[0.68rem] tracking-[0.14em] text-stone-600 uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Reference
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Enquiry
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Viewing
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Sent
                </th>
                <th scope="col" className="py-3 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="tabular py-4 pr-4 font-medium text-ink-900">
                    {inquiry.reference}
                  </td>
                  <td className="py-4 pr-4">
                    <span className="block text-stone-600">
                      {INQUIRY_TYPE_LABELS[inquiry.type]}
                    </span>
                    {inquiry.propertySlug ? (
                      <Link
                        href={`/properties/${inquiry.propertySlug}`}
                        className="text-ink-900 underline-offset-4 hover:underline"
                      >
                        {inquiry.propertyTitle}
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4 text-stone-700">
                    {inquiry.viewingDate ? formatDate(inquiry.viewingDate) : "—"}
                  </td>
                  <td className="py-4 pr-4 text-stone-700">{formatDate(inquiry.createdAt)}</td>
                  <td className="py-4">
                    <Badge tone="outline">{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          icon={<MessageSquare strokeWidth={1.25} />}
          title="No enquiries yet"
          description="When you ask about a residence or request a viewing, you can follow it here."
          action={<ButtonLink href="/properties">Browse residences</ButtonLink>}
        />
      )}
    </>
  );
}

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Enquiries />
    </Suspense>
  );
}
