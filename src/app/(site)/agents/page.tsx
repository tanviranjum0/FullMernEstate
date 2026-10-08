import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentAvatar } from "@/components/agents/agent-avatar";
import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/ui/section";
import { getAgents, getLocationTree } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "Our advisors",
  description:
    "Meet the advisors who represent our residences — each with a focus on particular neighbourhoods and property types.",
  alternates: { canonical: "/agents" },
};

export default async function AgentsPage() {
  const [agents, tree] = await Promise.all([getAgents(), getLocationTree()]);
  const names = new Map(
    tree.flatMap(({ city, neighbourhoods }) => [
      [city.slug, city.name],
      ...neighbourhoods.map((n) => [n.slug, n.name] as const),
    ]),
  );

  return (
    <>
      <PageIntro
        crumbs={[{ label: "Advisors", href: "/agents" }]}
        eyebrow="People"
        title="Advisors who know every home they show"
        lead="Each advisor focuses on a small number of neighbourhoods, so the person you speak to has walked the streets and seen the homes."
      />
      <div className="container-page pb-[var(--section-y)]">
        {agents.length === 0 ? (
          <EmptyState
            title="Our advisor profiles are being updated"
            description="Please contact us and we will introduce the right person."
          />
        ) : (
          <ul className="grid gap-px border border-sand-200 bg-sand-200 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <li key={agent.id} className="bg-ivory">
                <Link
                  href={`/agents/${agent.slug}`}
                  className="group flex h-full flex-col p-8 transition-colors hover:bg-paper"
                >
                  <AgentAvatar agent={agent} size="lg" />
                  <h2 className="mt-8 font-display text-[1.9rem] leading-tight text-ink-900">
                    {agent.name}
                  </h2>
                  {agent.title ? <p className="mt-1 text-stone-600">{agent.title}</p> : null}
                  {agent.areas.length ? (
                    <p className="mt-5 text-sm text-stone-600">
                      {agent.areas.map((slug) => names.get(slug) ?? slug).join(" · ")}
                    </p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-2 pt-8 text-[0.7rem] font-semibold tracking-[0.16em] text-ink-900 uppercase">
                    View profile
                    <ArrowRight
                      aria-hidden
                      strokeWidth={1.5}
                      className="size-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
