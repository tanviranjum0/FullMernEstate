import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleForm } from "@/components/admin/article-form";
import { AdminPageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/section";
import { requireAdminPermission } from "@/lib/auth/admin";
import type { ArticleInput } from "@/lib/validation/admin";
import { getAdminArticle, getAdminOptions } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Article" };

const EMPTY_ARTICLE: ArticleInput = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: null,
  category: "market-insights",
  authorId: "",
  authorName: "",
  tags: [],
  relatedLocationSlugs: [],
  status: "draft",
  featured: false,
  seo: { title: "", description: "" },
};

async function ArticleEditor({ params }: { params: PageProps<"/admin/insights/[id]">["params"] }) {
  const { id } = await params;
  await requireAdminPermission("content:manage", `/admin/insights/${id}`);
  const isNew = id === "new";
  const [article, options] = await Promise.all([
    isNew ? null : getAdminArticle(id),
    getAdminOptions(),
  ]);
  if (!isNew && !article) notFound();
  return (
    <>
      <AdminPageHeader
        title={isNew ? "New article" : article!.input.title}
        description={isNew ? undefined : `/insights/${article!.slug}`}
        back={{ href: "/admin/insights", label: "Insights" }}
      />
      <ArticleForm
        key={id}
        id={isNew ? null : id}
        initial={article?.input ?? EMPTY_ARTICLE}
        options={options}
      />
    </>
  );
}

export default function AdminArticlePage({ params }: PageProps<"/admin/insights/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ArticleEditor params={params} />
    </Suspense>
  );
}
