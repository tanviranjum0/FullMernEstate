"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { SheetContent, SheetRoot, SheetTrigger } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { mainNavigation } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <SheetRoot open={open} onOpenChange={setOpen} swipeDirection="left">
      <SheetTrigger
        aria-label="Open menu"
        className="grid size-11 place-items-center rounded-full transition-colors hover:bg-ink-900/5 group-data-[transparent]/header:hover:bg-ivory/10 lg:hidden"
      >
        <Menu strokeWidth={1.5} className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="left"
        title="Menu"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Link href="/account" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              My account
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className={buttonVariants({ variant: "primary", size: "sm" })}>
              Enquire
            </Link>
          </div>
        }
      >
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {[{ href: "/", label: "Home" }, ...mainNavigation, { href: "/contact", label: "Contact" }].map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between border-b border-sand-200 py-4 font-display text-[1.7rem] text-ink-900 transition-colors",
                      active ? "text-harbour-700" : "hover:text-harbour-700",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="mt-8 space-y-3 text-sm text-stone-700">
            <li>
              <Link href="/account/saved" onClick={() => setOpen(false)} className="hover:text-ink-900">
                Saved homes
              </Link>
            </li>
            <li>
              <Link href="/compare" onClick={() => setOpen(false)} className="hover:text-ink-900">
                Compare homes
              </Link>
            </li>
            <li>
              <Link href="/properties/map" onClick={() => setOpen(false)} className="hover:text-ink-900">
                Search on the map
              </Link>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </SheetRoot>
  );
}
