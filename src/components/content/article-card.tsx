import Link from "next/link";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { getArticleCategory } from "@/config/domain";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils/cn";
import type { ArticleCard as ArticleCardData } from "@/server/dto";

export function ArticleCard({
  article,
  className,
  size = "default",
  headingLevel = "h3",
}: {
  article: ArticleCardData;
  className?: string;
  size?: "default" | "large";
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const category = getArticleCategory(article.category);
  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={`/insights/${article.slug}`}
        tabIndex={-1}
        aria-hidden
        className={cn(
          "relative block overflow-hidden bg-sand-100",
          size === "large" ? "aspect-[16/10]" : "aspect-[3/2]",
        )}
      >
        <ResponsiveImage
          image={article.coverImage}
          alt=""
          sizes={
            size === "large"
              ? "(min-width: 1024px) 55vw, 92vw"
              : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
          }
          className="transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.04]"
        />
      </Link>
      <div className="pt-5">
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-600">
          {category ? <span>{category.name}</span> : null}
          <span aria-hidden className="size-0.5 rounded-full bg-stone-400" />
          <span className="tracking-[0.12em]">{article.readingMinutes} min read</span>
        </p>
        <Heading
          className={cn(
            "mt-3 font-display leading-[1.15] text-ink-900",
            size === "large" ? "text-heading-2" : "text-[1.55rem]",
          )}
        >
          <Link
            href={`/insights/${article.slug}`}
            className="transition-colors hover:text-harbour-700"
          >
            {article.title}
          </Link>
        </Heading>
        {article.excerpt ? (
          <p className={cn("mt-3 text-stone-600", size === "large" ? "text-lead" : "line-clamp-3")}>
            {article.excerpt}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-stone-600">
          {article.authorName}
          {article.publishedAt ? (
            <>
              <span aria-hidden> · </span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}
