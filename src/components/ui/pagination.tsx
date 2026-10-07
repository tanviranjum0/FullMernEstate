import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    const prev = sorted[index - 1];
    if (prev !== undefined && page - prev > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function Pagination({
  page,
  pageCount,
  hrefForPage,
  className,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const itemClass =
    "grid h-11 min-w-11 place-items-center rounded-sm px-3 text-sm tabular transition-colors hover:bg-sand-100";
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} rel="prev" className={cn(itemClass, "gap-2 px-4")} aria-label="Previous page">
          <ArrowLeft strokeWidth={1.5} className="size-4" />
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {pageWindow(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} aria-hidden className="px-2 text-stone-500">
              …
            </li>
          ) : (
            <li key={entry}>
              {entry === page ? (
                <span aria-current="page" className={cn(itemClass, "bg-ink-900 text-ivory hover:bg-ink-900")}>
                  {entry}
                </span>
              ) : (
                <Link href={hrefForPage(entry)} className={itemClass} aria-label={`Page ${entry}`}>
                  {entry}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>
      {page < pageCount ? (
        <Link href={hrefForPage(page + 1)} rel="next" className={cn(itemClass, "gap-2 px-4")} aria-label="Next page">
          <ArrowRight strokeWidth={1.5} className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
