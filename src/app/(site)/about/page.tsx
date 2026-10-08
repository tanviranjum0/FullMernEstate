import type { Metadata } from "next";
import Link from "next/link";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { PageIntro } from "@/components/layout/page-intro";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { Reveal } from "@/components/motion/motion";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { renderMarkdown } from "@/lib/security/markdown";
import { getAgents, getSiteSettings } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} represents a small number of exceptional homes, with one advisor guiding each client from first conversation to handover.`,
  alternates: { canonical: "/about" },
};

const approach = [
  {
    title: "We listen first",
    text: "Every search begins with a conversation about how you live, not a list of filters.",
  },
  {
    title: "We show selectively",
    text: "You see fewer homes, each chosen because it genuinely fits your brief.",
  },
  {
    title: "We check the details",
    text: "Documents, building services and running costs are reviewed before you commit.",
  },
  {
    title: "We stay with you",
    text: "The same advisor guides you through negotiation, registration and handover.",
  },
];

export default async function AboutPage() {
  const [settings, agents] = await Promise.all([getSiteSettings(), getAgents()]);
  return (
    <>
      <PageIntro
        crumbs={[{ label: "About", href: "/about" }]}
        eyebrow="About us"
        title="A considered approach to exceptional homes"
        lead="We work with a limited number of residences and clients at any one time, so that each receives the attention a significant decision deserves."
      />
      {settings.hero.image ? (
        <div className="container-page">
          <div className="relative aspect-[16/9] overflow-hidden bg-sand-100 lg:aspect-[21/8]">
            <ResponsiveImage
              image={settings.hero.image}
              sizes="(min-width: 1440px) 1340px, 100vw"
            />
          </div>
        </div>
      ) : null}

      <section className="container-page section-y grid gap-14 lg:grid-cols-12">
        <h2 className="font-display text-heading-1 text-ink-900 lg:col-span-4">Our story</h2>
        <div className="lg:col-span-7 lg:col-start-6">
          {settings.about.story ? (
            <div
              className="prose-editorial text-lead"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(settings.about.story) }}
            />
          ) : (
            <p className="text-lead text-stone-600">
              {siteConfig.name} represents residences across Bangladesh, with advisors who
              specialise in particular neighbourhoods.
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="approach-heading"
        className="bg-ink-950 py-[var(--section-y)] text-ivory"
      >
        <div className="container-page">
          <h2 id="approach-heading" className="font-display text-heading-1">
            How we work
          </h2>
          <ol className="mt-14 grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 0.08} className="bg-ink-950 p-8">
                <span className="tabular text-xs tracking-[0.2em] text-ivory/50">0{index + 1}</span>
                <h3 className="mt-6 font-display text-2xl">{step.title}</h3>
                <p className="mt-3 text-ivory/70">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {settings.about.values.length ? (
        <section className="container-page section-y">
          <h2 className="font-display text-heading-1 text-ink-900">What we value</h2>
          <dl className="mt-12 grid gap-10 md:grid-cols-3">
            {settings.about.values.map((value) => (
              <div key={value.id} className="border-t border-ink-900 pt-6">
                <dt className="font-display text-2xl text-ink-900">{value.title}</dt>
                <dd className="mt-3 text-stone-600">{value.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {agents.length ? (
        <section className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-heading-1 text-ink-900">The team</h2>
              <p className="mt-4 text-lead text-stone-600">
                Meet the advisors who represent our residences.
              </p>
              <ButtonLink href="/agents" variant="outline" className="mt-8">
                Meet our advisors
              </ButtonLink>
            </div>
            <ul className="flex -space-x-4">
              {agents.slice(0, 6).map((agent) => (
                <li key={agent.id}>
                  <Link href={`/agents/${agent.slug}`} aria-label={agent.name}>
                    <AgentAvatar agent={agent} size="lg" className="ring-4 ring-sand-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
