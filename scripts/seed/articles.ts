import type { ArticleCategorySlug } from "../../src/config/domain";
import type { SeedAgentSlug } from "./agents";
import {
  legacyImages,
  livingRooms,
  placeImages,
  villaExteriors,
  kitchens,
  type SeedImage,
} from "./images";

export interface SeedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategorySlug;
  author: SeedAgentSlug | null;
  coverImage: SeedImage;
  tags: string[];
  relatedLocationSlugs: string[];
  featured: boolean;
  daysAgo: number;
  body: string;
}

export const seedArticles: SeedArticle[] = [
  {
    slug: "buyers-checklist-for-prime-apartments",
    title: "A buyer's checklist for prime apartments",
    excerpt:
      "From title documents to generator capacity: the questions worth asking before you make an offer on a city apartment.",
    category: "buying-guides",
    author: "ayesha-rahman",
    coverImage: livingRooms[0]!,
    tags: ["buying", "due diligence", "apartments"],
    relatedLocationSlugs: ["dhaka", "gulshan", "banani"],
    featured: true,
    daysAgo: 5,
    body: `Buying a prime apartment is as much about the building and its paperwork as it is about the home itself. These are the questions we encourage every buyer to work through before making an offer.

## 1. The title and the land

Ask to see the full chain of title for the land the building stands on, and make sure the developer's agreement with the landowner is in order. A property lawyer should review these documents before any money changes hands. If an apartment is being resold, check that the seller's own purchase was properly registered.

## 2. Approvals and completion

Confirm that the building's plans were approved, that the building as constructed matches them, and whether an occupancy certificate has been issued. Extra floors or changes of use that were not approved can create problems later.

## 3. The building's services

In practice, day-to-day comfort depends on services that are easy to overlook on a viewing:

- **Generator capacity** — does it carry the full load, including lifts and air conditioning?
- **Water** — the source, storage capacity and any treatment.
- **Lifts** — their age, maintenance contract and backup power.
- **Parking** — whether spaces are allocated in the title or simply by custom.

## 4. Management and running costs

Ask who manages the building, how service charges are set, and whether there is a reserve fund for major repairs. Minutes from recent owners' meetings are often revealing.

## 5. Costs beyond the price

Registration, stamp duty and associated fees and taxes add meaningfully to the cost of a purchase. Rates change, so ask your lawyer for a current estimate early, and budget for legal fees and any fit-out you plan.

## Taking the next step

None of this needs to slow a good purchase down. Gathering documents in parallel with viewings means that when you find the right home, you can move with confidence.`,
  },
  {
    slug: "choosing-between-gulshan-banani-and-baridhara",
    title: "Gulshan, Banani or Baridhara? Choosing between Dhaka's northern neighbourhoods",
    excerpt:
      "Three neighbourhoods a short drive apart, each with a distinct character. How to decide which suits the way you live.",
    category: "neighbourhood-guides",
    author: "ayesha-rahman",
    coverImage: placeImages.dhaka[2]!,
    tags: ["Gulshan", "Banani", "Baridhara", "neighbourhoods"],
    relatedLocationSlugs: ["dhaka", "gulshan", "banani", "baridhara"],
    featured: true,
    daysAgo: 12,
    body: `Gulshan, Banani and Baridhara sit side by side around a chain of lakes in the north of Dhaka. They are often discussed together, but they suit quite different households.

## Gulshan: at the centre of things

Gulshan has the widest choice of prime apartments and the densest concentration of restaurants, offices and services. For many buyers its convenience outweighs the busier streets around Gulshan Avenue. Lake-facing buildings on the quieter roads are the most sought after.

## Banani: lively and slightly more relaxed

Banani shares a lake with Gulshan and has a well-known restaurant scene. Apartments tend to be a little smaller and better value than in Gulshan, and it is popular with professionals who want to walk to dinner.

## Baridhara: quiet and secure

The diplomatic zone in Baridhara is the calmest of the three, with controlled access and wide roads. Homes are often larger, and townhouses and garden apartments are more common. It suits families who prioritise privacy and security, and it is a natural choice for diplomatic households.

## How to decide

Start with your weekday routine: where you work, where the children go to school, and how much time you are prepared to spend in traffic. Then decide how much you value outdoor space and quiet compared with having restaurants on the doorstep. Viewing at different times of day — including a weekday evening — tells you more than any brochure.`,
  },
  {
    slug: "light-proportion-and-calm-at-home",
    title: "Light, proportion and calm: what makes a home feel generous",
    excerpt:
      "Floor area is only part of the story. Ceiling heights, window placement and circulation shape how a home feels to live in.",
    category: "architecture",
    author: "farhan-chowdhury",
    coverImage: legacyImages.brightInterior,
    tags: ["design", "architecture", "interiors"],
    relatedLocationSlugs: [],
    featured: false,
    daysAgo: 19,
    body: `Two homes with identical floor areas can feel completely different. When we walk clients through a property, we point to a few qualities that consistently make a home feel generous.

## Ceiling height

A few extra centimetres of ceiling height change the proportions of every room. Taller ceilings also allow taller windows, which bring daylight deeper into the plan.

## Windows on more than one side

Rooms with windows on two sides feel brighter and more balanced, and allow air to move through the space. Corner apartments and homes with a dual aspect are worth seeking out.

## Circulation that doesn't waste space

Long, dark corridors consume area without adding to daily life. Plans in which rooms open from a generous hall, or flow into one another, tend to feel larger than their square footage suggests.

## Thresholds to the outside

A terrace or balcony deep enough to sit on extends the living space for much of the year. Look at its depth, its orientation and how directly it connects to the main rooms.

## Materials that age well

Stone, timber and lime-based finishes tend to look better with age than high-gloss surfaces. They also tolerate humidity better, which matters through the monsoon.`,
  },
  {
    slug: "questions-to-ask-before-renting-at-the-top-end",
    title: "Renting at the top end: questions to ask before you sign",
    excerpt:
      "Deposits, maintenance responsibilities, generator costs and notice periods: what to clarify before agreeing a lease.",
    category: "buying-guides",
    author: "farhan-chowdhury",
    coverImage: livingRooms[8]!,
    tags: ["renting", "leases", "relocation"],
    relatedLocationSlugs: ["dhaka", "gulshan", "baridhara"],
    featured: false,
    daysAgo: 26,
    body: `Prime rentals move quickly, but a few minutes spent clarifying the lease avoids most disagreements later.

## The deposit and advance rent

Agree in writing how much is payable up front, what it covers, and the conditions for its return at the end of the lease.

## Who maintains what

Leases should say clearly who is responsible for air conditioning servicing, plumbing, appliance repairs and redecoration. In serviced apartments these are usually included; in unfurnished homes they often fall to the tenant.

## Service charges and utilities

Ask what the monthly service charge covers — security, generator fuel, lift maintenance, common-area cleaning — and how utilities are metered.

## Notice and renewal

Check the notice period on both sides, any break clause, and how rent will be reviewed at renewal.

## The inventory

For furnished homes, an inventory signed by both parties at the start of the lease protects everyone. Photographs help.`,
  },
  {
    slug: "holding-costs-beyond-the-purchase-price",
    title: "The holding costs to budget for beyond the purchase price",
    excerpt:
      "Service charges, maintenance, insurance and periodic refurbishment: a framework for estimating the true annual cost of owning a prime home.",
    category: "investment",
    author: "nadia-karim",
    coverImage: villaExteriors[3]!,
    tags: ["investment", "ownership costs", "second homes"],
    relatedLocationSlugs: ["coxs-bazar"],
    featured: false,
    daysAgo: 33,
    body: `The purchase price is only the beginning. Whether a home is for living in or letting, it pays to estimate its running costs before you buy.

## Recurring costs

- **Service charges** for shared security, generators, lifts and common areas.
- **Utilities**, including the cost of running a generator during outages.
- **Insurance** for the building and contents.
- **Municipal taxes**, which vary by location.

## Maintenance

Air conditioning, pumps, pools and generators all need regular servicing. Coastal homes need more frequent attention: salt air shortens the life of metalwork, paint and external fittings.

## Periodic refurbishment

Plan for kitchens, bathrooms and decoration to be refreshed over the life of your ownership, and set money aside each year rather than facing a single large bill.

## For homes you plan to let

Add management fees, furnishing replacement and periods when the home is empty. A realistic estimate of net income is far more useful than a headline rental figure.`,
  },
  {
    slug: "designing-for-the-monsoon",
    title: "Designing for the monsoon: details that keep a home comfortable",
    excerpt:
      "Deep overhangs, cross-ventilation and the right finishes make a noticeable difference to how a home performs through the wet season.",
    category: "lifestyle",
    author: "imran-hossain",
    coverImage: kitchens[3]!,
    tags: ["design", "climate", "maintenance"],
    relatedLocationSlugs: ["sylhet", "dhaka"],
    featured: false,
    daysAgo: 41,
    body: `Heavy rain and high humidity test every detail of a house. Older homes in the region often handled the monsoon well, and their lessons still apply.

## Shade and shelter

Deep roof overhangs and verandas keep rain off walls and windows and allow windows to stay open during downpours.

## Air movement

Cross-ventilation reduces humidity and the risk of mould. Look for homes where windows on opposite sides of a room can be opened.

## Drainage

Check roof drainage, terrace falls and the ground around the house. Water should move quickly away from the building.

## Finishes

Breathable finishes such as lime plaster and mineral paints cope better with humidity than impermeable coatings, which can trap moisture behind them.`,
  },
];

export const seedSiteSettings = {
  contact: {
    email: "hello@example.com",
    phone: "",
    whatsapp: "",
    address: "Gulshan 2, Dhaka",
    officeHours: "Sunday to Thursday, 10:00–18:00",
  },
  hero: {
    eyebrow: "Dhaka · Chattogram · Cox's Bazar · Sylhet",
    headline: "Exceptional homes, thoughtfully represented",
    subheadline:
      "Penthouses, villas and residences of distinction — presented with care, and matched to the way you live.",
    image: legacyImages.coastalVilla,
  },
  about: {
    story: `We represent a small number of exceptional homes at any one time, and we prefer it that way. It allows each advisor to know every property in detail, to present it properly, and to give buyers, tenants and owners the time a significant decision deserves.

Our work is guided by a simple idea: the right home is about how you want to live, not only what you can find. We listen first, show selectively, and handle every stage — from the first viewing to registration and handover — with discretion.`,
    values: [
      {
        title: "Discretion",
        text: "Many of our clients prefer privacy. We share details only with qualified, introduced buyers.",
      },
      {
        title: "Accuracy",
        text: "We describe homes as they are, with clear information about documents, services and costs.",
      },
      {
        title: "Continuity",
        text: "One advisor stays with you from the first conversation to the day you receive the keys.",
      },
    ],
  },
  faqs: [
    {
      question: "How do I arrange a viewing?",
      answer:
        "Request a viewing from any property page or contact an advisor directly. We will confirm a time that suits you.",
    },
    {
      question: "Do you charge buyers a fee?",
      answer:
        "Fees depend on the service you need. Your advisor will explain any fees in writing before you commit.",
    },
  ],
  announcement:
    "Demonstration site: the listings, advisors and articles shown are sample data for evaluation purposes.",
};
