import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9", className)}>
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M11 12.5h18M20 12.5V28" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M15.5 28h9" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Wordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn(
        "group inline-flex items-center gap-3 transition-colors",
        onDark ? "text-ivory" : "text-ink-900",
        className,
      )}
    >
      <Monogram className="transition-transform duration-500 ease-luxe group-hover:rotate-90" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] tracking-[0.01em]">
          {siteConfig.wordmark.primary}
        </span>
        <span className="mt-1 text-[0.58rem] font-semibold tracking-[0.42em] uppercase opacity-80">
          {siteConfig.wordmark.secondary}
        </span>
      </span>
    </Link>
  );
}
