import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AgentForm } from "@/components/admin/agent-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { AgentInput } from "@/lib/validation/admin";
import { getAdminAgent, getAdminOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Advisor" };

const EMPTY_AGENT: AgentInput = {
  name: "",
  slug: "",
  title: "",
  bio: "",
  photo: null,
  email: "",
  phone: "",
  whatsapp: "",
  languages: [],
  specialties: [],
  areas: [],
  socials: { linkedin: "", instagram: "", website: "" },
  active: true,
  sortOrder: 100,
  userEmail: "",
  seo: { title: "", description: "" },
};

async function AgentEditor({ params }: { params: PageProps<"/admin/agents/[id]">["params"] }) {
  const { id } = await params;
  await requireAdminPermission("agents:manage", `/admin/agents/${id}`);
  const isNew = id === "new";
  const [agent, options] = await Promise.all([isNew ? null : getAdminAgent(id), getAdminOptions()]);
  if (!isNew && !agent) notFound();
  return (
    <>
      <AdminPageHeader
        title={isNew ? "New advisor" : agent!.input.name}
        description={isNew ? undefined : `/agents/${agent!.slug}`}
        back={{ href: "/admin/agents", label: "Advisors" }}
      />
      <AgentForm key={id} id={isNew ? null : id} initial={agent?.input ?? EMPTY_AGENT} options={options} />
    </>
  );
}

export default function AdminAgentPage({ params }: PageProps<"/admin/agents/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AgentEditor params={params} />
    </Suspense>
  );
}
