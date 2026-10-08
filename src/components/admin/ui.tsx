import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function AdminPageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1 text-sm text-stone-600 hover:text-ink-900"
          >
            <ChevronLeft aria-hidden className="size-4" /> {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description ? <div className="mt-1 text-sm text-stone-600">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-md border border-sand-200 bg-white", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-sand-200 px-5 py-4">
          <div>
            <h2 className="text-[0.95rem] font-semibold text-ink-900">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-stone-600">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

const PILL_TONES = {
  neutral: "bg-sand-100 text-stone-700",
  green: "bg-success-50 text-success-600",
  amber: "bg-warning-50 text-warning-600",
  red: "bg-danger-50 text-danger-600",
  blue: "bg-harbour-50 text-harbour-700",
  dark: "bg-ink-900 text-ivory",
} as const;

export type PillTone = keyof typeof PILL_TONES;

export function Pill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        PILL_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONES: Record<string, PillTone> = {
  published: "green",
  draft: "amber",
  archived: "neutral",
  new: "blue",
  contacted: "amber",
  qualified: "amber",
  viewing_scheduled: "blue",
  negotiating: "amber",
  won: "green",
  lost: "neutral",
  spam: "red",
  available: "green",
  under_offer: "amber",
  sold: "dark",
  rented: "dark",
};

export function DataTable({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-sand-200 bg-white">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export const th =
  "border-b border-sand-200 bg-sand-100/60 px-4 py-2.5 text-xs font-semibold text-stone-700";
export const td = "border-b border-sand-200 px-4 py-3 align-middle";

/** GET-based filter bar so admin filters are linkable and work without JavaScript. */
export function FilterForm({ action, children }: { action: string; children: ReactNode }) {
  return (
    <form action={action} className="mb-4 flex flex-wrap items-end gap-2" role="search">
      {children}
      <button
        type="submit"
        className="h-9 rounded-sm bg-ink-900 px-4 text-xs font-semibold text-ivory hover:bg-harbour-800"
      >
        Apply
      </button>
    </form>
  );
}

export const filterInput =
  "h-9 rounded-sm border border-sand-300 bg-white px-3 text-sm text-ink-900 focus:border-ink-800 focus:outline-none focus:ring-2 focus:ring-harbour-200";

export function readParam(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return single?.trim() || undefined;
}

export function readPage(value: string | string[] | undefined): number {
  const number = Number(readParam(value));
  return Number.isInteger(number) && number > 0 ? number : 1;
}

export function pageHref(base: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
