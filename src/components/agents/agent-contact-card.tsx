import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { TrackedAnchor } from "@/components/analytics/tracked-link";
import type { AgentCard } from "@/server/dto";
import { AgentAvatar } from "./agent-avatar";

const actionClass =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-ink-900/15 text-[0.7rem] font-semibold tracking-[0.1em] text-ink-900 uppercase transition-colors hover:border-ink-900";

export function AgentContactCard({
  agent,
  propertyId,
  eyebrow = "Your advisor",
}: {
  agent: AgentCard;
  propertyId?: string;
  eyebrow?: string;
}) {
  const phone = agent.phone.replace(/[^\d+]/g, "");
  const whatsapp = agent.whatsapp.replace(/[^\d]/g, "");
  return (
    <div>
      <div className="flex items-center gap-4">
        <AgentAvatar agent={agent} size="md" />
        <div className="min-w-0">
          <p className="eyebrow text-stone-600">{eyebrow}</p>
          <p className="mt-1 font-display text-2xl leading-tight text-ink-900">
            <Link href={`/agents/${agent.slug}`} className="hover:text-harbour-700">
              {agent.name}
            </Link>
          </p>
          {agent.title ? <p className="truncate text-sm text-stone-600">{agent.title}</p> : null}
        </div>
      </div>
      {phone || agent.email || whatsapp ? (
        <div className="mt-5 flex gap-2">
          {phone ? (
            <TrackedAnchor
              href={`tel:${phone}`}
              event="phone_click"
              subject={propertyId}
              className={actionClass}
            >
              <Phone aria-hidden strokeWidth={1.5} className="size-4" /> Call
            </TrackedAnchor>
          ) : null}
          {agent.email ? (
            <TrackedAnchor
              href={`mailto:${agent.email}`}
              event="email_click"
              subject={propertyId}
              className={actionClass}
            >
              <Mail aria-hidden strokeWidth={1.5} className="size-4" /> Email
            </TrackedAnchor>
          ) : null}
          {whatsapp ? (
            <TrackedAnchor
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              event="whatsapp_click"
              subject={propertyId}
              className={actionClass}
            >
              <MessageCircle aria-hidden strokeWidth={1.5} className="size-4" /> WhatsApp
            </TrackedAnchor>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
