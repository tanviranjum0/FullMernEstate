import type { Metadata } from "next";
import { Suspense } from "react";
import { InsightsListing, parseInsightsParams } from "@/components/content/insights-listing";
import { PageIntro } from "@/components/layout/page-intro";
import { Skeleton } from "@/components/ui/section";

export async function generateMetadata({
  searchParams,
}: PageProps<"/insights">): Promise<Metadata> {
  const { page, q } = parseInsightsParams(await searchParams);
  return {
    title: page > 1 ? `Insights — page ${page}` : "Insights",
    description:
      "Market analysis, neighbourhood guides, buying advice and notes on architecture and living well.",
    alternates: { canonical: page > 1 ? `/insights?page=${page}` : "/insights" },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

async function Listing({ searchParams }: { searchParams: PageProps<"/insights">["searchParams"] }) {
  const { page, q } = parseInsightsParams(await searchParams);
  return <InsightsListing page={page} q={q} />;
}

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Insights", href: "/insights" }]}
        eyebrow="Journal"
        title="Insights"
        lead="Considered writing on the market, the neighbourhoods we know, and the details that make a home."
      />
      <Suspense
        fallback={
          <div className="container-page">
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <Listing searchParams={searchParams} />
      </Suspense>
    </>
  );
}
