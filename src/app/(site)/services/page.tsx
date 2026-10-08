import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/page-intro";
import { Reveal } from "@/components/motion/motion";
import { ButtonLink } from "@/components/ui/button";
import { services } from "@/config/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Buying, selling, renting, valuation, investment advisory, relocation and property management — with one advisor throughout.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Services", href: "/services" }]}
        eyebrow="Services"
        title="Advice for every stage of owning a home"
        lead="Whether you are buying, selling, letting or investing, one advisor stays with you from the first conversation to completion."
      />
      <div className="container-page pb-[var(--section-y)]">
        <ol className="border-t border-sand-200">
          {services.map((service, index) => (
            <Reveal as="li" key={service.slug}>
              <section
                id={service.slug}
                aria-labelledby={`${service.slug}-title`}
                className="grid scroll-mt-32 gap-8 border-b border-sand-200 py-14 lg:grid-cols-12"
              >
                <span className="tabular text-sm tracking-[0.2em] text-stone-500 lg:col-span-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="lg:col-span-4">
                  <h2
                    id={`${service.slug}-title`}
                    className="font-display text-heading-2 text-ink-900"
                  >
                    {service.title}
                  </h2>
                  <p className="mt-4 text-lead text-stone-600">{service.summary}</p>
                </div>
                <ul className="space-y-3 lg:col-span-4 lg:col-start-7">
                  {service.details.map((detail) => (
                    <li key={detail} className="flex gap-3 text-ink-800">
                      <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-bronze-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
                <div className="lg:col-span-2 lg:col-start-11 lg:text-right">
                  <ButtonLink
                    href={`/contact?type=${service.inquiryType}`}
                    variant="outline"
                    size="sm"
                  >
                    {service.cta}
                  </ButtonLink>
                </div>
              </section>
            </Reveal>
          ))}
        </ol>
      </div>
    </>
  );
}
