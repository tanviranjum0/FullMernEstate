"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/saved", label: "Saved homes" },
  { href: "/account/searches", label: "Saved searches" },
  { href: "/account/enquiries", label: "Enquiries & viewings" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <p className="eyebrow mb-4 hidden text-stone-600 lg:block">Your account</p>
      <ul className="scrollbar-none -mx-[var(--gutter)] flex gap-1 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:flex-col lg:px-0">
        {links.map((link) => {
          const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-sm px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                  active ? "bg-ink-900 text-ivory" : "text-stone-700 hover:bg-sand-100 hover:text-ink-900",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
