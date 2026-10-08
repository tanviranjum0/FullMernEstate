import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { AgentContactCard } from "@/components/agents/agent-contact-card";
import { ArticleCard } from "@/components/content/article-card";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import {
  getAgentBySlug,
  getAgents,
  getArticlesByAuthor,
  getLocationTree,
} from "@/server/queries/content";
import { getPropertiesByAgent } from "@/server/queries/properties";

export async function generateStaticParams() {
  const agents = await getAgents();
  return agents.length ? agents.map((agent) => ({ slug: agent.slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/agents/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return { title: "Advisor not found", robots: { index: false, follow: true } };
  const title = agent.seo.title || `${agent.name}${agent.title ? `, ${agent.title}` : ""}`;
  const description =
    agent.seo.description ||
    agent.bio.split("\n")[0]?.slice(0, 160) ||
    `${agent.name} at ${siteConfig.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/agents/${agent.slug}` },
    openGraph: { title, description, type: "profile" },
  };
}

async function AgentProfile({ params }: { params: PageProps<"/agents/[slug]">["params"] }) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();
  const [listings, articles, tree] = await Promise.all([
    getPropertiesByAgent(agent.id, 9),
    getArticlesByAuthor(agent.id, 3),
    getLocationTree(),
  ]);
  const locationLinks = new Map(
    tree.flatMap(({ city, neighbourhoods }) => [
      [city.slug, { name: city.name, href: city.href }] as const,
      ...neighbourhoods.map((n) => [n.slug, { name: n.name, href: n.href }] as const),
    ]),
  );
  const paragraphs = agent.bio.split(/\n{2,}/).filter(Boolean);
  const socials = Object.entries(agent.socials).filter(([, url]) => url);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: agent.name,
          jobTitle: agent.title || undefined,
          url: `${siteConfig.url}/agents/${agent.slug}`,
          knowsLanguage: agent.languages,
          worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          sameAs: socials.map(([, url]) => url),
        }}
      />
      <div className="container-page pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { label: "Advisors", href: "/agents" },
            { label: agent.name, href: `/agents/${agent.slug}` },
          ]}
        />
        <div className="mt-12 grid gap-14 pb-[var(--section-y)] lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
              <AgentAvatar agent={agent} size="xl" />
              <div>
                <h1 className="font-display text-display-2 text-ink-900">{agent.name}</h1>
                {agent.title ? (
                  <p className="mt-2 text-lead text-stone-600">{agent.title}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-12 max-w-2xl space-y-5 text-[1.05rem] leading-[1.8] text-ink-800">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className={index === 0 ? "text-lead text-ink-900" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
            <dl className="mt-12 grid gap-8 border-t border-sand-200 pt-10 sm:grid-cols-3">
              {agent.areas.length ? (
                <div>
                  <dt className="eyebrow text-stone-600">Areas</dt>
                  <dd className="mt-3 space-y-1.5">
                    {agent.areas.map((slug) => {
                      const location = locationLinks.get(slug);
                      return location ? (
                        <Link
                          key={slug}
                          href={location.href}
                          className="block text-ink-900 underline-offset-4 hover:underline"
                        >
                          {location.name}
                        </Link>
                      ) : (
                        <span key={slug} className="block">
                          {slug}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              ) : null}
              {agent.specialties.length ? (
                <div>
                  <dt className="eyebrow text-stone-600">Specialties</dt>
                  <dd className="mt-3 space-y-1.5 text-ink-900">
                    {agent.specialties.map((item) => (
                      <span key={item} className="block">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {agent.languages.length ? (
                <div>
                  <dt className="eyebrow text-stone-600">Languages</dt>
                  <dd className="mt-3 text-ink-900">{agent.languages.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
            {socials.length ? (
              <ul className="mt-8 flex gap-5">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm tracking-[0.12em] text-stone-700 uppercase hover:text-ink-900"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <aside aria-label={`Contact ${agent.name}`}>
            <div className="bg-paper p-6 shadow-hairline sm:p-8 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:max-h-[calc(100dvh-var(--header-h)-3rem)] lg:overflow-y-auto lg:overscroll-contain">
              <AgentContactCard agent={agent} eyebrow="Get in touch" />
              <div className="mt-8 border-t border-sand-200 pt-8">
                <h2 className="font-display text-heading-3 text-ink-900">
                  Send {agent.name.split(" ")[0]} a message
                </h2>
                <div className="mt-6">
                  <InquiryForm agentId={agent.id} types={["agent"]} compact />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {listings.length ? (
        <section aria-labelledby="agent-listings" className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page">
            <h2 id="agent-listings" className="font-display text-heading-1 text-ink-900">
              Residences represented by {agent.name.split(" ")[0]}
            </h2>
            <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((property) => (
                <li key={property.id}>
                  <PropertyCard property={property} aspect="aspect-[4/3]" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {articles.length ? (
        <section aria-labelledby="agent-articles" className="container-page py-[var(--section-y)]">
          <h2 id="agent-articles" className="font-display text-heading-1 text-ink-900">
            Writing
          </h2>
          <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export default function AgentPage({ params }: PageProps<"/agents/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-14">
          <Skeleton className="size-40 rounded-full" />
          <Skeleton className="mt-8 h-14 w-1/2" />
        </div>
      }
    >
      <AgentProfile params={params} />
    </Suspense>
  );
}
