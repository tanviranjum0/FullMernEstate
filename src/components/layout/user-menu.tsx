"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, UserRound } from "lucide-react";
import { useTransition } from "react";
import { authClient } from "@/lib/auth/client";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

export interface UserMenuUser {
  name: string;
  email: string;
  canAccessAdmin: boolean;
}

const itemClass =
  "flex w-full cursor-pointer items-center rounded-xs px-3 py-2.5 text-sm text-ink-800 outline-none data-[highlighted]:bg-sand-100";

export function UserMenu({ user }: { user: UserMenuUser | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="hidden items-center gap-2 text-[0.72rem] font-semibold tracking-[0.16em] uppercase sm:flex"
      >
        <UserRound strokeWidth={1.5} className="size-[18px]" />
        Sign in
      </Link>
    );
  }

  const signOut = () =>
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });

  return (
    <Menu.Root>
      <Menu.Trigger
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-ink-900/5 group-data-[transparent]/header:hover:bg-ivory/10"
        aria-label={`Account menu for ${user.name}`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-harbour-700 text-[0.7rem] font-semibold text-ivory">
          {initials(user.name) || "•"}
        </span>
        <ChevronDown strokeWidth={1.5} className="hidden size-4 sm:block" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end" className="z-50">
          <Menu.Popup
            className={cn(
              "min-w-60 rounded-sm bg-paper p-1.5 text-ink-900 shadow-float ring-1 ring-ink-900/5",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            )}
          >
            <div className="border-b border-sand-200 px-3 pt-2 pb-3">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-stone-600">{user.email}</p>
            </div>
            <div className="py-1">
              <Menu.Item className={itemClass} render={<Link href="/account" />}>
                Overview
              </Menu.Item>
              <Menu.Item className={itemClass} render={<Link href="/account/saved" />}>
                Saved homes
              </Menu.Item>
              <Menu.Item className={itemClass} render={<Link href="/account/searches" />}>
                Saved searches
              </Menu.Item>
              <Menu.Item className={itemClass} render={<Link href="/account/enquiries" />}>
                Enquiries & viewings
              </Menu.Item>
              <Menu.Item className={itemClass} render={<Link href="/account/settings" />}>
                Settings
              </Menu.Item>
              {user.canAccessAdmin ? (
                <Menu.Item className={cn(itemClass, "text-harbour-700")} render={<Link href="/admin" />}>
                  Administration
                </Menu.Item>
              ) : null}
            </div>
            <div className="border-t border-sand-200 pt-1">
              <Menu.Item className={itemClass} onClick={signOut} disabled={pending}>
                {pending ? "Signing out…" : "Sign out"}
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
