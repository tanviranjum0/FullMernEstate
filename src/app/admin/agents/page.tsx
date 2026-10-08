import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { adminButton } from "@/components/admin/form-kit";
import { AdminPageHeader, DataTable, Pill, td, th } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import { listAdminAgents } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Advisors" };

async function Agents() {
  await requireAdminPermission("agents:manage", "/admin/agents");
  const agents = await listAdminAgents();
  return (
    <>
      <AdminPageHeader
        title="Advisors"
        description={`${agents.filter((a) => a.active).length} active of ${agents.length}`}
        actions={
          <Link href="/admin/agents/new" className={adminButton.primary}>
            <Plus aria-hidden className="size-4" /> New advisor
          </Link>
        }
      />
      <DataTable caption="Advisors">
        <thead>
          <tr>
            <th scope="col" className={th}>
              Advisor
            </th>
            <th scope="col" className={th}>
              Email
            </th>
            <th scope="col" className={th}>
              Listings
            </th>
            <th scope="col" className={th}>
              Sign-in
            </th>
            <th scope="col" className={th}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} className="hover:bg-sand-100/40">
              <td className={td}>
                <Link
                  href={`/admin/agents/${agent.id}`}
                  className="font-medium text-ink-900 hover:underline"
                >
                  {agent.name}
                </Link>
                <p className="text-xs text-stone-600">{agent.title}</p>
              </td>
              <td className={`${td} text-stone-700`}>{agent.email || "—"}</td>
              <td className={`${td} tabular`}>{agent.listings}</td>
              <td className={td}>
                {agent.linked ? <Pill tone="blue">Linked</Pill> : <Pill>No account</Pill>}
              </td>
              <td className={td}>
                {agent.active ? <Pill tone="green">Active</Pill> : <Pill>Inactive</Pill>}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

export default function AdminAgentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Agents />
    </Suspense>
  );
}
