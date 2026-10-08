import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { Monogram } from "@/components/layout/wordmark";
import { Skeleton } from "@/components/ui/section";
import { ROLE_LABELS } from "@/config/domain";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: { default: "Administration", template: `%s — Admin | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

const NAV: (AdminNavItem & { permission: Permission })[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", permission: "dashboard:view" },
  {
    href: "/admin/properties",
    label: "Listings",
    icon: "properties",
    permission: "properties:manage_own",
  },
  {
    href: "/admin/inquiries",
    label: "Enquiries",
    icon: "inquiries",
    permission: "inquiries:manage_own",
  },
  { href: "/admin/agents", label: "Advisors", icon: "agents", permission: "agents:manage" },
  {
    href: "/admin/locations",
    label: "Locations",
    icon: "locations",
    permission: "locations:manage",
  },
  { href: "/admin/insights", label: "Insights", icon: "insights", permission: "content:manage" },
  { href: "/admin/users", label: "Users", icon: "users", permission: "users:manage" },
  {
    href: "/admin/settings",
    label: "Site settings",
    icon: "settings",
    permission: "settings:manage",
  },
  { href: "/admin/audit-log", label: "Audit log", icon: "audit", permission: "audit:read" },
];

/** Server-side gate: unauthenticated visitors are redirected, other roles see an explicit refusal. */
async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (!hasPermission(user.role, "admin:access")) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-ivory px-6">
        <div className="max-w-md text-center">
          <ShieldAlert aria-hidden strokeWidth={1.25} className="mx-auto size-10 text-stone-500" />
          <h1 className="mt-5 font-display text-heading-2 text-ink-900">
            No access to administration
          </h1>
          <p className="mt-3 text-stone-600">
            Your account does not have staff permissions. If you think this is a mistake, contact an
            administrator.
          </p>
          <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">
            Return to the website
          </Link>
        </div>
      </main>
    );
  }
  // Managing "own" items is implied by managing all of them.
  const can = (permission: Permission) =>
    hasPermission(user.role, permission) ||
    (permission === "properties:manage_own" && hasPermission(user.role, "properties:manage_all")) ||
    (permission === "inquiries:manage_own" && hasPermission(user.role, "inquiries:manage_all"));
  const items = NAV.filter((item) => can(item.permission)).map(({ href, label, icon }) => ({
    href,
    label,
    icon,
  }));

  return (
    <div className="min-h-dvh bg-[#f4f2ee] lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="bg-ink-950 text-ivory lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Monogram className="size-8" />
            <span className="text-sm font-semibold tracking-[0.12em] uppercase">Admin</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-ivory/60 hover:text-ivory lg:hidden"
          >
            Site <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        </div>
        <div className="px-3 pb-3 lg:flex-1 lg:overflow-y-auto">
          <AdminNav items={items} />
        </div>
        <div className="hidden border-t border-ivory/10 px-5 py-4 text-xs lg:block">
          <p className="truncate text-ivory/90">{user.name || user.email}</p>
          <p className="text-ivory/50">{ROLE_LABELS[user.role]}</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1 text-ivory/60 hover:text-ivory"
          >
            View website <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#f4f2ee] p-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-8 h-64 w-full" />
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
