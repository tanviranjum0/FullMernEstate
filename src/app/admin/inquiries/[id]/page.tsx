import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import { InquiryControls } from "@/components/admin/inquiry-controls";
import { AdminPageHeader, Panel, Pill, STATUS_TONES } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import {
  CONTACT_METHOD_LABELS,
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
  VIEWING_TIME_SLOT_LABELS,
  type ContactMethod,
  type ViewingTimeSlot,
} from "@/config/domain";
import { requireAdminPermission } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/auth/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import { getAdminInquiry, getAdminOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Enquiry" };

async function InquiryDetail({ params }: { params: PageProps<"/admin/inquiries/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireAdminPermission(
    ["inquiries:manage_all", "inquiries:manage_own"],
    `/admin/inquiries/${id}`,
  );
  const [inquiry, options] = await Promise.all([getAdminInquiry(user, id), getAdminOptions()]);
  if (!inquiry) notFound();
  const phone = inquiry.phone.replace(/[^\d+]/g, "");

  return (
    <>
      <AdminPageHeader
        title={inquiry.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {INQUIRY_TYPE_LABELS[inquiry.type]} · Ref {inquiry.reference} ·{" "}
            {formatDateTime(inquiry.createdAt)}
            <Pill tone={STATUS_TONES[inquiry.status]}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Pill>
          </span>
        }
        back={{ href: "/admin/inquiries", label: "Enquiries" }}
      />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Contact">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-stone-600">Email</dt>
                <dd>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="inline-flex items-center gap-1.5 text-ink-900 underline underline-offset-2"
                  >
                    <Mail aria-hidden className="size-3.5" /> {inquiry.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Phone</dt>
                <dd className="flex flex-wrap gap-3">
                  {phone ? (
                    <>
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1.5 text-ink-900 underline underline-offset-2"
                      >
                        <Phone aria-hidden className="size-3.5" /> {inquiry.phone}
                      </a>
                      <a
                        href={`https://wa.me/${phone.replace(/^\+/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-900 underline underline-offset-2"
                      >
                        <MessageCircle aria-hidden className="size-3.5" /> WhatsApp
                      </a>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Prefers</dt>
                <dd className="text-ink-900">
                  {CONTACT_METHOD_LABELS[inquiry.preferredContact as ContactMethod] ??
                    inquiry.preferredContact}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Account</dt>
                <dd className="text-ink-900">
                  {inquiry.hasAccount ? "Signed-in client" : "Guest"}
                </dd>
              </div>
              {inquiry.property ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-stone-600">Listing</dt>
                  <dd>
                    <Link
                      href={`/properties/${inquiry.property.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-ink-900 underline underline-offset-2"
                    >
                      {inquiry.property.title} <ExternalLink aria-hidden className="size-3.5" />
                    </Link>
                  </dd>
                </div>
              ) : null}
              {inquiry.viewing ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-stone-600">Requested viewing</dt>
                  <dd className="text-ink-900">
                    {formatDate(inquiry.viewing.date)}
                    {inquiry.viewing.timeSlot
                      ? `, ${VIEWING_TIME_SLOT_LABELS[inquiry.viewing.timeSlot as ViewingTimeSlot]}`
                      : ", any time"}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Panel>
          <Panel title="Message">
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-900">
              {inquiry.message || "No message."}
            </p>
            {inquiry.source ? (
              <p className="mt-4 text-xs text-stone-500">Sent from {inquiry.source}</p>
            ) : null}
          </Panel>
          <Panel title="Notes">
            {inquiry.notes.length ? (
              <ul className="space-y-4">
                {inquiry.notes.map((note) => (
                  <li key={note.id} className="border-l-2 border-sand-300 pl-3">
                    <p className="text-sm whitespace-pre-line text-ink-900">{note.body}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {note.author} · {formatDateTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-600">No notes yet.</p>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Manage">
            <InquiryControls
              id={inquiry.id}
              status={inquiry.status}
              assignedTo={inquiry.assignedTo}
              agents={options.agents}
              canAssign={hasPermission(user.role, "inquiries:manage_all")}
            />
          </Panel>
          {inquiry.history.length ? (
            <Panel title="History">
              <ul className="space-y-2 text-sm">
                {inquiry.history.map((entry) => (
                  <li key={entry.id}>
                    <p className="text-ink-900">{entry.summary}</p>
                    <p className="text-xs text-stone-500">
                      {entry.actor} · {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function AdminInquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <InquiryDetail params={params} />
    </Suspense>
  );
}
