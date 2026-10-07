import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ResponsiveImage } from "@/components/media/responsive-image";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/section";
import { getArticleCategory } from "@/config/domain";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/security/markdown";
import { absoluteUrl, ogImage, ogImageUrl } from "@/lib/seo/url";
import { getArticleBySlug, getArticleSlugs, getRelatedArticles } from "@/server/queries/content";

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.length ? slugs.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: true } };
  const title = article.seo.title || article.title;
  const description = article.seo.description || article.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/insights/${article.slug}` },
    authors: [{ name: article.authorName }],
    openGraph: {
      type: "article",
      title,
      description,
      url: `/insights/${article.slug}`,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: [article.authorName],
      images: ogImage(article.coverImage),
    },
  };
}

async function ArticleContent({ params }: { params: PageProps<"/insights/[slug]">["params"] }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const related = await getRelatedArticles({
    id: article.id,
    category: article.category,
    relatedLocationSlugs: article.relatedLocationSlugs,
  });
  const category = getArticleCategory(article.category);

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          image: article.coverImage ? [ogImageUrl(article.coverImage)] : undefined,
          datePublished: article.publishedAt ?? undefined,
          dateModified: article.updatedAt,
          author: article.authorSlug
            ? { "@type": "Person", name: article.authorName, url: absoluteUrl(`/agents/${article.authorSlug}`) }
            : { "@type": "Organization", name: siteConfig.name },
          publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          mainEntityOfPage: absoluteUrl(`/insights/${article.slug}`),
        }}
      />
      <header className="container-prose pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { label: "Insights", href: "/insights" },
            ...(category ? [{ label: category.name, href: `/insights/category/${category.slug}` }] : []),
            { label: article.title, href: `/insights/${article.slug}` },
          ]}
        />
        <h1 className="mt-10 font-display text-display-2 text-ink-900">{article.title}</h1>
        {article.excerpt ? <p className="mt-6 text-lead text-stone-600">{article.excerpt}</p> : null}
        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
          {article.authorSlug ? (
            <Link href={`/agents/${article.authorSlug}`} className="font-semibold text-ink-900 hover:underline">
              {article.authorName}
            </Link>
          ) : (
            <span className="font-semibold text-ink-900">{article.authorName}</span>
          )}
          {article.publishedAt ? (
            <>
              <span aria-hidden>·</span>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{article.readingMinutes} min read</span>
        </p>
      </header>
      {article.coverImage ? (
        <div className="container-page mt-12">
          <div className="relative aspect-[16/9] overflow-hidden bg-sand-100 lg:aspect-[21/9]">
            <ResponsiveImage image={article.coverImage} sizes="(min-width: 1440px) 1340px, 100vw" priority />
          </div>
        </div>
      ) : null}
      <div className="container-prose py-16">
        <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
        {article.tags.length ? (
          <ul className="mt-14 flex flex-wrap gap-2 border-t border-sand-200 pt-8">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-sand-300 px-3 py-1 text-sm text-stone-700">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-14 bg-ink-950 p-8 text-ivory sm:p-10">
          <h2 className="font-display text-heading-3">Considering a move?</h2>
          <p className="mt-3 text-ivory/75">An advisor can talk you through the market and the homes available now.</p>
          <ButtonLink href="/contact?type=consultation" variant="light" className="mt-6">
            Arrange a conversation
          </ButtonLink>
        </div>
      </div>
      {related.length ? (
        <section aria-labelledby="related-heading" className="bg-sand-100 py-[var(--section-y)]">
          <div className="container-page">
            <h2 id="related-heading" className="font-display text-heading-1 text-ink-900">
              Further reading
            </h2>
            <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <ArticleCard article={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default function ArticlePage({ params }: PageProps<"/insights/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="container-prose pt-14">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="mt-6 h-6 w-2/3" />
        </div>
      }
    >
      <ArticleContent params={params} />
    </Suspense>
  );
}
