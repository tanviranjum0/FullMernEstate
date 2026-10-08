import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { SearchLauncher } from "@/components/search/search-launcher";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { getCities } from "@/server/queries/content";
import { HeaderShell } from "./header-shell";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { Wordmark } from "./wordmark";

async function HeaderUser() {
  const user = await getCurrentUser();
  return (
    <UserMenu
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              canAccessAdmin: hasPermission(user.role, "admin:access"),
            }
          : null
      }
    />
  );
}

async function HeaderSearch() {
  const cities = await getCities();
  return (
    <SearchLauncher
      shortcuts={[
        { label: "All residences", href: "/properties" },
        { label: "Homes to rent", href: "/properties?listing=rent" },
        ...cities.map((city) => ({ label: `Homes in ${city.name}`, href: city.href })),
        { label: "Search on the map", href: "/properties/map" },
      ]}
    />
  );
}

export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-6">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Wordmark className="text-current" />
        </div>
        <NavLinks />
        <div className="flex items-center gap-1 sm:gap-3">
          <HeaderSearch />
          <Suspense fallback={<span className="hidden w-20 sm:block" aria-hidden />}>
            <HeaderUser />
          </Suspense>
          <ButtonLink
            href="/contact"
            size="sm"
            className={cn(
              "ml-2 hidden md:inline-flex",
              "group-data-[transparent]/header:bg-ivory group-data-[transparent]/header:text-ink-900 group-data-[transparent]/header:hover:bg-white",
            )}
          >
            Enquire
          </ButtonLink>
        </div>
      </div>
    </HeaderShell>
  );
}
