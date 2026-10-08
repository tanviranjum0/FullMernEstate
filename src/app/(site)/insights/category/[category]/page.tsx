import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InsightsListing, parseInsightsParams } from "@/components/content/insights-listing";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/section";
import { ARTICLE_CATEGORIES, getArticleCategory, type ArticleCategorySlug } from "@/config/domain";

export function generateStaticParams() {
  return ARTICLE_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/insights/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  const definition = getArticleCategory(category);
  if (!definition) return { title: "Not found", robots: { index: false } };
  const { page, q } = parseInsightsParams(await searchParams);
  const base = `/insights/category/${definition.slug}`;
  return {
    title: page > 1 ? `${definition.name} — page ${page}` : `${definition.name} — Insights`,
    description: definition.description,
    alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

async function CategoryListing({
  category,
  searchParams,
}: {
  category: ArticleCategorySlug;
  searchParams: PageProps<"/insights/category/[category]">["searchParams"];
}) {
  const { page, q } = parseInsightsParams(await searchParams);
  return <InsightsListing category={category} page={page} q={q} />;
}

// Resolved before anything streams so unknown slugs answer with a real 404 status.
export const instant = false;

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/insights/category/[category]">) {
  const { category } = await params;
  const definition = getArticleCategory(category);
  if (!definition) notFound();
  return (
    <>
      <PageIntro
        crumbs={[
          { label: "Insights", href: "/insights" },
          { label: definition.name, href: `/insights/category/${definition.slug}` },
        ]}
        eyebrow="Insights"
        title={definition.name}
        lead={definition.description}
      />
      <Suspense
        fallback={
          <div className="container-page pt-14">
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <CategoryListing category={definition.slug} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
