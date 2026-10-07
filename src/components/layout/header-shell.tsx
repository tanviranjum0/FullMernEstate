"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const OVERLAY_ROUTES = new Set(["/"]);

/**
 * Sticky header frame. On routes with a full-bleed hero it starts transparent over the image
 * and settles into a solid bar once the page scrolls.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlayRoute = OVERLAY_ROUTES.has(pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overlayRoute && !scrolled;
  return (
    <header
      data-transparent={transparent || undefined}
      className={cn(
        "group/header sticky top-0 z-40 w-full transition-[background-color,color,border-color,box-shadow] duration-500 ease-calm",
        transparent
          ? "border-b border-transparent bg-transparent text-ivory"
          : "border-b border-sand-200 bg-ivory/92 text-ink-900 backdrop-blur-md",
      )}
    >
      {children}
    </header>
  );
}
