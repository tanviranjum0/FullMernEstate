import type { InquiryType } from "./domain";

export interface ServiceDefinition {
  slug: string;
  title: string;
  summary: string;
  details: string[];
  inquiryType: InquiryType;
  cta: string;
}

/** Service descriptions state what we do — never unverifiable claims about scale or results. */
export const services: ServiceDefinition[] = [
  {
    slug: "buying",
    title: "Buying",
    summary: "A shortlist built around how you live, with documents checked before you commit.",
    details: [
      "Private briefing to understand your requirements and timing",
      "Access to listed and selected off-market homes",
      "Coordination of title review with your lawyer",
      "Negotiation, registration and handover support",
    ],
    inquiryType: "consultation",
    cta: "Discuss a purchase",
  },
  {
    slug: "selling",
    title: "Selling",
    summary: "Considered presentation, accurate pricing and a discreet, qualified audience.",
    details: [
      "Pricing advice based on comparable homes",
      "Architectural photography and written presentation",
      "Viewings with pre-qualified buyers only",
      "Management of offers through to completion",
    ],
    inquiryType: "valuation",
    cta: "Request a valuation",
  },
  {
    slug: "letting",
    title: "Renting & letting",
    summary: "Homes for relocating families and executives, and well-run lets for owners.",
    details: [
      "Search and viewing programmes for incoming tenants",
      "Lease negotiation and inventory",
      "Tenant referencing for landlords",
      "Optional ongoing property management",
    ],
    inquiryType: "consultation",
    cta: "Talk about renting",
  },
  {
    slug: "valuation",
    title: "Valuation",
    summary: "A realistic view of what your home is worth today, and why.",
    details: [
      "In-person inspection by an advisor",
      "Written summary of comparable evidence",
      "Guidance on presentation before sale or let",
    ],
    inquiryType: "valuation",
    cta: "Book a valuation",
  },
  {
    slug: "investment-advisory",
    title: "Investment advisory",
    summary: "Clear-eyed analysis of yields, holding costs and long-term demand.",
    details: [
      "Assessment of rental demand by neighbourhood",
      "Holding-cost and net-yield estimates",
      "Portfolio review for existing owners",
    ],
    inquiryType: "consultation",
    cta: "Arrange a consultation",
  },
  {
    slug: "relocation",
    title: "Relocation",
    summary: "Help settling in, from school-run logistics to temporary accommodation.",
    details: [
      "Neighbourhood orientation tours",
      "Coordination with relocation and HR teams",
      "Short-term and serviced accommodation",
    ],
    inquiryType: "consultation",
    cta: "Plan a relocation",
  },
  {
    slug: "property-management",
    title: "Property management",
    summary: "Care of your home and tenancy while you are away.",
    details: [
      "Rent collection and statements",
      "Maintenance coordination with vetted contractors",
      "Periodic inspections and reports",
    ],
    inquiryType: "consultation",
    cta: "Ask about management",
  },
];
