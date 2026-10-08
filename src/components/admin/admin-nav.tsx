"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  MapPinned,
  ScrollText,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

const ICONS = {
  dashboard: LayoutDashboard,
  properties: Building2,
  inquiries: Inbox,
  agents: UserRound,
  locations: MapPinned,
  insights: FileText,
  users: Users,
  settings: Settings,
  audit: ScrollText,
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  active ? "bg-ivory/10 text-ivory" : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory",
                )}
              >
                <Icon aria-hidden strokeWidth={1.5} className="size-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
