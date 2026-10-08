import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm, ProfileForm, SessionControls } from "@/components/account/settings-forms";
import { Skeleton } from "@/components/ui/section";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-sand-200 py-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
      <div>
        <h2 className="font-display text-2xl text-ink-900">{title}</h2>
        {description ? <p className="mt-2 text-sm text-stone-600">{description}</p> : null}
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

async function Settings() {
  const user = await requireUser("/account/settings");
  return (
    <>
      <h1 className="mb-10 font-display text-heading-1 text-ink-900">Settings</h1>
      <Panel title="Profile" description="How advisors address and contact you.">
        <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} />
      </Panel>
      <Panel title="Password" description="Changing your password signs out your other devices.">
        <PasswordForm />
      </Panel>
      <Panel title="Sessions">
        <SessionControls />
      </Panel>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Settings />
    </Suspense>
  );
}
