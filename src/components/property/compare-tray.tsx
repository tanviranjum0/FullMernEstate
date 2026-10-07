"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { compareList } from "./client-stores";

/** Floating tray that appears once a home is added to the comparison list. */
export function CompareTray() {
  const ids = compareList.useList();
  const pathname = usePathname();
  if (ids.length === 0 || pathname.startsWith("/compare")) return null;
  return (
    <div
      role="region"
      aria-label="Comparison"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 animate-fade-up items-center gap-3 rounded-sm bg-ink-900 py-2 pr-2 pl-4 text-ivory shadow-float sm:bottom-6"
    >
      <Scale aria-hidden strokeWidth={1.5} className="size-4" />
      <p className="text-sm whitespace-nowrap">
        {ids.length} {ids.length === 1 ? "home" : "homes"} selected
      </p>
      <Link
        href={`/compare?ids=${ids.join(",")}`}
        className={cn(buttonVariants({ variant: "light", size: "sm" }), "ml-1")}
      >
        Compare
      </Link>
      <button
        type="button"
        onClick={() => compareList.clear()}
        aria-label="Clear comparison"
        className="grid size-9 place-items-center rounded-full text-ivory/70 transition-colors hover:bg-ivory/10 hover:text-ivory"
      >
        <X strokeWidth={1.5} className="size-4" />
      </button>
    </div>
  );
}
