import Link from "next/link";
import { Search } from "lucide-react";
import { ArticleCard } from "@/components/content/article-card";
import { EmptyState } from "@/components/ui/section";
import { Pagination } from "@/components/ui/pagination";
import { ARTICLE_CATEGORIES, type ArticleCategorySlug } from "@/config/domain";
import { cn } from "@/lib/utils/cn";
import { getArticles } from "@/server/queries/content";

export async function InsightsListing({
  category,
  page,
  q,
}: {
  category?: ArticleCategorySlug;
  page: number;
  q?: string;
}) {
  const results = await getArticles({ category, page, q });
  const basePath = category ? `/insights/category/${category}` : "/insights";
  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  const [lead, ...rest] = results.items;
  const showLead = page === 1 && !q && lead;

  return (
    <div className="container-page pb-[var(--section-y)]">
      <div className="flex flex-col gap-6 border-y border-sand-200 py-5 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Categories"
          className="-mx-[var(--gutter)] scrollbar-none overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:px-0"
        >
          <ul className="flex gap-2 whitespace-nowrap">
            <li>
              <Link
                href="/insights"
                aria-current={!category ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
                  !category
                    ? "border-ink-900 bg-ink-900 text-ivory"
                    : "border-sand-300 hover:border-ink-900",
                )}
              >
                All
              </Link>
            </li>
            {ARTICLE_CATEGORIES.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/insights/category/${item.slug}`}
                  aria-current={category === item.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
                    category === item.slug
                      ? "border-ink-900 bg-ink-900 text-ivory"
                      : "border-sand-300 hover:border-ink-900",
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form
          action={basePath}
          role="search"
          className="flex h-11 w-full items-center gap-2 rounded-sm border border-sand-300 bg-paper px-3 lg:w-80"
        >
          <Search aria-hidden strokeWidth={1.5} className="size-4 text-stone-500" />
          <label htmlFor="insights-search" className="sr-only">
            Search insights
          </label>
          <input
            id="insights-search"
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder="Search insights"
            className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
        </form>
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          className="mt-12"
          title={q ? `No articles match “${q}”` : "No articles here yet"}
          description="Try another search term or browse all insights."
        />
      ) : (
        <>
          {showLead ? (
            <div className="mt-14">
              <ArticleCard
                article={lead}
                size="large"
                headingLevel="h2"
                className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-12"
              />
            </div>
          ) : null}
          <ul className="mt-16 grid gap-x-6 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
            {(showLead ? rest : results.items).map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} headingLevel="h2" />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-20"
            page={results.page}
            pageCount={results.pageCount}
            hrefForPage={hrefFor}
          />
        </>
      )}
    </div>
  );
}

export function parseInsightsParams(raw: Record<string, string | string[] | undefined>) {
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const pageValue = Number(single(raw.page));
  const q = single(raw.q)?.trim().slice(0, 80) || undefined;
  return {
    page: Number.isInteger(pageValue) && pageValue > 1 && pageValue <= 100 ? pageValue : 1,
    q,
  };
}
