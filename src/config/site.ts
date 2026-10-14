/**
 * Turns "example.com", "https://example.com/" or "localhost:3000" into a bare origin such as
 * "https://example.com", so a URL entered without its scheme cannot break metadata or auth.
 */
export function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed);
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(trimmed);
  return new URL(hasScheme ? trimmed : `${isLocal ? "http" : "https"}://${trimmed}`).origin;
}

export function resolveSiteUrl({
  siteUrl,
  vercelProductionUrl,
  production,
}: {
  siteUrl?: string;
  vercelProductionUrl?: string;
  production: boolean;
}): string {
  const configured = siteUrl?.trim()
    ? siteUrl
    : vercelProductionUrl?.trim()
      ? `https://${vercelProductionUrl}`
      : undefined;

  if (!configured) {
    if (production) {
      throw new Error(
        "Set NEXT_PUBLIC_SITE_URL to the public HTTPS origin before building for production.",
      );
    }
    return "http://localhost:3000";
  }

  const origin = normalizeOrigin(configured);
  if (production) {
    const { hostname, protocol } = new URL(origin);
    const localHost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";
    if (protocol !== "https:" || localHost) {
      throw new Error(
        "The production site URL must be a public HTTPS origin; check NEXT_PUBLIC_SITE_URL.",
      );
    }
  }
  return origin;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "TanvirDev Property",
  wordmark: { primary: "TanvirDev", secondary: "Property" },
  tagline: "Residences of distinction",
  description:
    "Curated luxury residences, penthouses and estates. Search exceptional homes, explore neighbourhoods, and arrange private viewings with dedicated advisors.",
  // Client components import this shared config for other public values; resolve the URL only
  // where server-rendered metadata, canonicals, robots or the sitemap actually need it.
  get url() {
    return resolveSiteUrl({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      production: process.env.NODE_ENV === "production",
    });
  },
  locale: "en",
  defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "BDT",
  areaUnit: "sq ft",
} as const;

export const mainNavigation = [
  { href: "/properties", label: "Properties" },
  { href: "/locations", label: "Locations" },
  { href: "/agents", label: "Advisors" },
  { href: "/insights", label: "Insights" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
] as const;

export const footerNavigation = {
  discover: [
    { href: "/properties?listing=sale", label: "Homes for sale" },
    { href: "/properties?listing=rent", label: "Homes to rent" },
    { href: "/properties?flags=new-construction", label: "New developments" },
    { href: "/properties/map", label: "Map search" },
    { href: "/compare", label: "Compare homes" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/agents", label: "Our advisors" },
    { href: "/insights", label: "Insights" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const;
