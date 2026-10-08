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

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalizeOrigin(explicit);
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return `https://${vercelProduction}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "TanvirDev Property",
  wordmark: { primary: "TanvirDev", secondary: "Property" },
  tagline: "Residences of distinction",
  description:
    "Curated luxury residences, penthouses and estates. Search exceptional homes, explore neighbourhoods, and arrange private viewings with dedicated advisors.",
  url: resolveSiteUrl(),
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
