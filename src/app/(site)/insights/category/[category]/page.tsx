import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InsightsListing, parseInsightsParams } from "@/components/content/insights-listing";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/section";
import { ARTICLE_CATEGORIES, getArticleCategory } from "@/config/domain";

export function generateStaticParams() {
  return ARTICLE_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/insights/category/[category]">): Promise<Metadata> {
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

async function CategoryContent({ params, searchParams }: PageProps<"/insights/category/[category]">) {
  const { category } = await params;
  const definition = getArticleCategory(category);
  if (!definition) notFound();
  const { page, q } = parseInsightsParams(await searchParams);
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
      <InsightsListing category={definition.slug} page={page} q={q} />
    </>
  );
}

export default function CategoryPage(props: PageProps<"/insights/category/[category]">) {
  return (
    <Suspense fallback={<div className="container-page pt-14"><Skeleton className="h-96 w-full" /></div>}>
      <CategoryContent {...props} />
    </Suspense>
  );
}
