import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getAdminSettings } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Site settings" };

async function Settings() {
  await requireAdminPermission("settings:manage", "/admin/settings");
  const settings = await getAdminSettings();
  return <SettingsForm initial={settings} />;
}

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="Content shared across the public website. Changes are live as soon as they are saved."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Settings />
      </Suspense>
    </>
  );
}
