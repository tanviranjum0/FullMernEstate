import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/section";
import type { InquiryType } from "@/config/domain";
import { getCurrentUser } from "@/lib/auth/session";
import { getSiteSettings } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Arrange a consultation, request a valuation or ask us a question. An advisor will reply within one working day.",
  alternates: { canonical: "/contact" },
};

const CONTACT_TYPES: InquiryType[] = ["general", "consultation", "valuation"];

async function ContactForm({
  searchParams,
}: {
  searchParams: PageProps<"/contact">["searchParams"];
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.type) ? params.type[0] : params.type;
  const defaultType = CONTACT_TYPES.find((type) => type === requested) ?? "general";
  const user = await getCurrentUser();
  return (
    <InquiryForm
      key={defaultType}
      types={CONTACT_TYPES}
      defaultType={defaultType}
      defaultName={user?.name}
      defaultEmail={user?.email}
    />
  );
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const settings = await getSiteSettings();
  const { contact } = settings;
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Contact", href: "/contact" }]}
        eyebrow="Contact"
        title="Let us know how we can help"
        lead="Tell us a little about what you are looking for. An advisor will reply, usually within one working day."
      />
      <div className="container-page grid gap-16 pb-[var(--section-y)] lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="bg-paper p-6 shadow-hairline sm:p-10">
            <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
              <ContactForm searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
        <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
          {contact.address ? (
            <div>
              <h2 className="eyebrow text-stone-600">Office</h2>
              <p className="mt-3 font-display text-2xl text-ink-900">{contact.address}</p>
              {contact.officeHours ? (
                <p className="mt-2 text-stone-600">{contact.officeHours}</p>
              ) : null}
            </div>
          ) : null}
          {contact.email ? (
            <div>
              <h2 className="eyebrow text-stone-600">Email</h2>
              <a
                href={`mailto:${contact.email}`}
                className="mt-3 block font-display text-2xl text-ink-900 hover:text-harbour-700"
              >
                {contact.email}
              </a>
            </div>
          ) : null}
          {contact.phone ? (
            <div>
              <h2 className="eyebrow text-stone-600">Telephone</h2>
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="mt-3 block font-display text-2xl text-ink-900 hover:text-harbour-700"
              >
                {contact.phone}
              </a>
            </div>
          ) : null}
          {settings.faqs.length ? (
            <div>
              <h2 className="eyebrow text-stone-600">Common questions</h2>
              <div className="mt-4 divide-y divide-sand-200 border-y border-sand-200">
                {settings.faqs.map((faq) => (
                  <details key={faq.id} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-ink-900 [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <span
                        aria-hidden
                        className="text-xl text-stone-500 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2 text-sm text-stone-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
