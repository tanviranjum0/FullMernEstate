import type { MetadataRoute } from "next";
import { ARTICLE_CATEGORIES } from "@/config/domain";
import { siteConfig } from "@/config/site";
import { getAgents, getArticleSlugs, getLocationTree } from "@/server/queries/content";
import { getPublishedPropertySlugs } from "@/server/queries/properties";

/**
 * Lists only canonical, indexable URLs. Account, admin, auth, comparison, map and filtered
 * search permutations are deliberately excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [properties, tree, agents, articles] = await Promise.all([
    getPublishedPropertySlugs(),
    getLocationTree(),
    getAgents(),
    getArticleSlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/properties`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/properties?listing=sale`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/properties?listing=rent`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/locations`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/agents`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/insights`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.1 },
  ];

  return [
    ...staticRoutes,
    ...properties.map((p) => ({
      url: `${base}/properties/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...tree.flatMap(({ city, neighbourhoods }) => [
      { url: `${base}${city.href}`, changeFrequency: "weekly" as const, priority: 0.7 },
      ...neighbourhoods.map((n) => ({ url: `${base}${n.href}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ]),
    ...agents.map((agent) => ({ url: `${base}/agents/${agent.slug}`, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...ARTICLE_CATEGORIES.map((category) => ({
      url: `${base}/insights/category/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...articles.map((article) => ({
      url: `${base}/insights/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
