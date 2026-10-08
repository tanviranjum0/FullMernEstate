import { placeImages, villaExteriors, apartmentExteriors, livingRooms } from "./images";
import type { SeedImage } from "./images";

export interface SeedLocation {
  kind: "city" | "neighbourhood";
  slug: string;
  parentSlug: string;
  name: string;
  headline: string;
  intro: string;
  body: string;
  heroImage: SeedImage;
  highlights: { title: string; text: string }[];
  lifestyle: string[];
  nearby: string[];
  marketNotes: string;
  faqs: { question: string; answer: string }[];
  center: { lat: number; lng: number };
  zoom: number;
  sortOrder: number;
}

export const seedLocations: SeedLocation[] = [
  {
    kind: "city",
    slug: "dhaka",
    parentSlug: "",
    name: "Dhaka",
    headline: "The capital's most established addresses",
    intro:
      "Bangladesh's capital and its largest market for prime residential property, from lakeside penthouses in Gulshan to garden houses in Dhanmondi.",
    body: `Dhaka's prime residential market is concentrated in a handful of planned neighbourhoods in the north and centre of the city. Gulshan, Banani and Baridhara sit around a network of lakes and are home to most of the city's embassies, international schools and corporate offices. Further south, Dhanmondi is one of the city's older planned residential areas, arranged around its own lake.

## Choosing a neighbourhood

Buyers and tenants usually weigh three things: the daily commute, school runs, and how much outdoor space they want. Lakeside apartments in Gulshan and Banani trade some outdoor space for views and convenience; Baridhara offers quieter, more security-conscious streets; Dhanmondi and Bashundhara offer more space for the price.

## What to expect

Most prime homes are apartments and duplexes in low- to mid-rise buildings with lifts, generators, security and parking. Detached houses with gardens are rare and tend to change hands privately.`,
    heroImage: placeImages.dhaka[0]!,
    highlights: [
      {
        title: "Lakeside living",
        text: "Gulshan, Banani and Dhanmondi are arranged around lakes with walking paths.",
      },
      {
        title: "Diplomatic quarter",
        text: "Baridhara hosts much of the city's diplomatic community.",
      },
      {
        title: "International schools",
        text: "Several international schools operate in the northern neighbourhoods.",
      },
    ],
    lifestyle: [
      "Lakeside walks",
      "Restaurants and cafés",
      "Private clubs",
      "International schools",
    ],
    nearby: ["Hazrat Shahjalal International Airport", "Gulshan and Banani lakes", "Hatirjheel"],
    marketNotes:
      "Figures on this page are calculated from listings currently published on this site, not from market-wide transaction data.",
    faqs: [
      {
        question: "Which Dhaka neighbourhoods have the most prime listings?",
        answer:
          "Gulshan, Banani and Baridhara account for most prime apartment and penthouse listings, with Dhanmondi and Bashundhara offering larger homes for the price.",
      },
      {
        question: "Can foreign nationals rent in Dhaka?",
        answer:
          "Yes. Many tenants in the diplomatic and business community rent in Gulshan, Banani and Baridhara. Your advisor can explain typical lease terms and deposits.",
      },
    ],
    center: { lat: 23.7937, lng: 90.4066 },
    zoom: 12,
    sortOrder: 1,
  },
  {
    kind: "neighbourhood",
    slug: "gulshan",
    parentSlug: "dhaka",
    name: "Gulshan",
    headline: "Lakeside apartments and penthouses at the heart of the city",
    intro:
      "Dhaka's best-known prime address, with lakeside apartments, embassies, restaurants and international offices within a short drive.",
    body: `Gulshan is divided into Gulshan 1 and Gulshan 2, linked by Gulshan Avenue. The neighbourhood is bordered by lakes on several sides, and the quieter residential roads behind the avenue are lined with low- and mid-rise apartment buildings.

## Homes in Gulshan

Most homes are apartments of three to five bedrooms, with a smaller number of duplexes and penthouses on the upper floors of newer buildings. Lake-facing units and buildings on quieter roads command a premium.

## Daily life

Gulshan has a dense concentration of restaurants, cafés, banks and offices, and is close to Baridhara and Banani. The lakeside paths are popular for walking in the early morning and evening.`,
    heroImage: apartmentExteriors[4]!,
    highlights: [
      {
        title: "Lake frontage",
        text: "Several roads back onto Gulshan Lake, with walking paths along the water.",
      },
      {
        title: "Central location",
        text: "Quick access to Banani, Baridhara and the airport road.",
      },
    ],
    lifestyle: ["Lakeside paths", "Restaurants", "Gulshan Avenue", "Embassies nearby"],
    nearby: ["Gulshan Lake Park", "Baridhara", "Banani"],
    marketNotes: "",
    faqs: [
      {
        question: "What types of property are typical in Gulshan?",
        answer:
          "Mostly three- to five-bedroom apartments, with duplexes and penthouses in newer buildings. Detached houses are uncommon.",
      },
    ],
    center: { lat: 23.7925, lng: 90.4148 },
    zoom: 14,
    sortOrder: 1,
  },
  {
    kind: "neighbourhood",
    slug: "banani",
    parentSlug: "dhaka",
    name: "Banani",
    headline: "Leafy streets between Gulshan and the airport road",
    intro:
      "A residential neighbourhood with a lively restaurant scene, its own lake and easy access to Gulshan and the north of the city.",
    body: `Banani sits immediately west of Gulshan across Banani Lake. Its numbered roads mix residential buildings with restaurants and shops, and the neighbourhood is popular with professionals who want a central location with a slightly calmer feel than Gulshan Avenue.

## Homes in Banani

Expect apartments in mid-rise buildings, a number of duplexes, and penthouses on newer developments. Lake-facing buildings are particularly sought after.`,
    heroImage: livingRooms[3]!,
    highlights: [
      { title: "Banani Lake", text: "A green edge shared with Gulshan, with walking paths." },
      { title: "Dining", text: "One of the city's best-known restaurant districts." },
    ],
    lifestyle: ["Restaurants", "Lakeside paths", "Boutique shopping"],
    nearby: ["Gulshan", "Mohakhali", "Airport road"],
    marketNotes: "",
    faqs: [],
    center: { lat: 23.794, lng: 90.4043 },
    zoom: 14,
    sortOrder: 2,
  },
  {
    kind: "neighbourhood",
    slug: "baridhara",
    parentSlug: "dhaka",
    name: "Baridhara",
    headline: "Quiet, security-conscious streets in the diplomatic zone",
    intro:
      "Home to many of Dhaka's embassies and ambassadorial residences, with wide, quiet roads and larger homes.",
    body: `Baridhara's diplomatic zone is one of the most security-conscious residential areas in Dhaka, with controlled access and wide, quiet roads. Homes here tend to be larger, and townhouses and garden apartments are more common than elsewhere in the north of the city.

## Who lives here

Diplomatic households, senior executives and families who prioritise quiet streets and security. Rental demand from embassies and international organisations is a notable feature of the market.`,
    heroImage: villaExteriors[5]!,
    highlights: [
      {
        title: "Diplomatic zone",
        text: "Many embassies and ambassadorial residences are located here.",
      },
      { title: "Space", text: "Larger apartments and townhouses than in neighbouring areas." },
    ],
    lifestyle: ["Quiet streets", "Embassies", "Proximity to Gulshan"],
    nearby: ["Gulshan 2", "Baridhara Lake", "Bashundhara"],
    marketNotes: "",
    faqs: [],
    center: { lat: 23.8008, lng: 90.4219 },
    zoom: 14,
    sortOrder: 3,
  },
  {
    kind: "neighbourhood",
    slug: "dhanmondi",
    parentSlug: "dhaka",
    name: "Dhanmondi",
    headline: "Established homes around Dhanmondi Lake",
    intro:
      "One of Dhaka's older planned residential areas, known for its lake, schools, cultural institutions and long-established families.",
    body: `Dhanmondi is arranged around Dhanmondi Lake, whose landscaped banks form one of the city's most-used public green spaces. The area has a strong residential character, with schools, hospitals and cultural institutions close at hand.

## Homes in Dhanmondi

A mix of apartments and older houses, some on generous plots. Renovated houses and newer apartment buildings near the lake are the most sought after.`,
    heroImage: placeImages.dhaka[4]!,
    highlights: [
      {
        title: "Dhanmondi Lake",
        text: "Landscaped lakeside paths running through the neighbourhood.",
      },
      {
        title: "Established",
        text: "A long-standing residential community with schools and hospitals nearby.",
      },
    ],
    lifestyle: ["Lakeside paths", "Schools", "Cultural venues"],
    nearby: ["Dhanmondi Lake", "Science Lab", "Mohammadpur"],
    marketNotes: "",
    faqs: [],
    center: { lat: 23.7461, lng: 90.3742 },
    zoom: 14,
    sortOrder: 4,
  },
  {
    kind: "neighbourhood",
    slug: "bashundhara",
    parentSlug: "dhaka",
    name: "Bashundhara R/A",
    headline: "Space and newer construction in the north-east",
    intro:
      "A large planned residential area with newer buildings, universities and hospitals, offering more space for the price than the lakeside neighbourhoods.",
    body: `Bashundhara Residential Area is a large planned district in the north-east of the city. Its blocks are laid out on a grid, and a significant share of the housing stock is recent construction.

## Homes in Bashundhara

Apartments, duplexes and a growing number of detached houses on larger plots. Buyers often choose Bashundhara for space, newer specifications and access to the universities and hospitals in the area.`,
    heroImage: villaExteriors[2]!,
    highlights: [
      { title: "Newer construction", text: "Much of the housing stock is recent." },
      { title: "Larger plots", text: "More detached houses than in central neighbourhoods." },
    ],
    lifestyle: ["Universities", "Hospitals", "Wide roads"],
    nearby: ["Baridhara", "Airport road", "Purbachal Expressway"],
    marketNotes: "",
    faqs: [],
    center: { lat: 23.8193, lng: 90.4526 },
    zoom: 14,
    sortOrder: 5,
  },
  {
    kind: "city",
    slug: "chattogram",
    parentSlug: "",
    name: "Chattogram",
    headline: "Hillside homes in the port city",
    intro:
      "Bangladesh's port city, where the most sought-after homes sit on the green hills of Khulshi and the residential streets of Nasirabad.",
    body: `Chattogram is the country's principal port and its second-largest city. Its prime residential areas occupy the hills to the north of the centre, where homes benefit from greenery, cooler air and views across the city.

## Neighbourhoods

Khulshi is the best-known hillside residential area, with detached houses and low-rise apartment buildings. Nasirabad offers apartments close to the city's clubs, schools and commercial districts.`,
    heroImage: placeImages.chattogram[1]!,
    highlights: [
      { title: "Hillside living", text: "Khulshi's hills offer greenery and views over the city." },
      { title: "Port city", text: "The country's main port and a major commercial centre." },
    ],
    lifestyle: ["Hillside roads", "Clubs", "Proximity to the Bay of Bengal"],
    nearby: ["Patenga beach", "Foy's Lake", "Shah Amanat International Airport"],
    marketNotes:
      "Figures on this page are calculated from listings currently published on this site, not from market-wide transaction data.",
    faqs: [],
    center: { lat: 22.3569, lng: 91.7832 },
    zoom: 12,
    sortOrder: 2,
  },
  {
    kind: "neighbourhood",
    slug: "khulshi",
    parentSlug: "chattogram",
    name: "Khulshi",
    headline: "Green hills above the city",
    intro:
      "Chattogram's best-known hillside residential area, with detached houses and low-rise apartments.",
    body: `Khulshi occupies a series of hills north of the city centre. Roads wind between gardens and low-rise buildings, and many homes look out over the city.

## Homes in Khulshi

Detached houses with gardens and low-rise apartment buildings. Homes with views and level gardens are scarce and sought after.`,
    heroImage: villaExteriors[9]!,
    highlights: [{ title: "Views", text: "Elevated plots with outlooks across the city." }],
    lifestyle: ["Gardens", "Hillside walks"],
    nearby: ["Foy's Lake", "Nasirabad"],
    marketNotes: "",
    faqs: [],
    center: { lat: 22.361, lng: 91.809 },
    zoom: 14,
    sortOrder: 1,
  },
  {
    kind: "neighbourhood",
    slug: "nasirabad",
    parentSlug: "chattogram",
    name: "Nasirabad",
    headline: "Central, residential and well connected",
    intro: "A residential district close to Chattogram's clubs, schools and commercial centre.",
    body: `Nasirabad combines residential streets with easy access to the city's commercial districts. It is popular with families who want a central location with good access to schools.`,
    heroImage: apartmentExteriors[6]!,
    highlights: [
      { title: "Central", text: "Close to the city's commercial districts and schools." },
    ],
    lifestyle: ["Schools", "Clubs", "Shopping"],
    nearby: ["Khulshi", "GEC Circle"],
    marketNotes: "",
    faqs: [],
    center: { lat: 22.3664, lng: 91.8181 },
    zoom: 14,
    sortOrder: 2,
  },
  {
    kind: "city",
    slug: "coxs-bazar",
    parentSlug: "",
    name: "Cox's Bazar",
    headline: "Coastal homes on the Bay of Bengal",
    intro:
      "A long, unbroken sandy coastline on the Bay of Bengal, with holiday apartments in town and villas along the Marine Drive to Inani.",
    body: `Cox's Bazar is the country's best-known seaside destination. Its beach runs south from the town for well over a hundred kilometres, and the Marine Drive coastal road links the town with Inani and Teknaf.

## Homes on the coast

Apartments in town are bought as holiday homes and for rental income, while villas and larger plots are found along the Marine Drive, where homes face the sea with the hills behind.`,
    heroImage: placeImages.coxsBazar[1]!,
    highlights: [
      { title: "Marine Drive", text: "A coastal road between the hills and the sea." },
      { title: "Holiday homes", text: "Strong seasonal demand for furnished apartments." },
    ],
    lifestyle: ["Beach", "Seafood", "Coastal drives"],
    nearby: ["Inani beach", "Himchhari", "Cox's Bazar Airport"],
    marketNotes:
      "Figures on this page are calculated from listings currently published on this site, not from market-wide transaction data.",
    faqs: [],
    center: { lat: 21.4272, lng: 92.0058 },
    zoom: 11,
    sortOrder: 3,
  },
  {
    kind: "neighbourhood",
    slug: "inani",
    parentSlug: "coxs-bazar",
    name: "Inani",
    headline: "Villas between the hills and the sea",
    intro:
      "A quieter stretch of coast south of the town along the Marine Drive, known for its rocky shoreline.",
    body: `Inani lies south of Cox's Bazar town along the Marine Drive. The beach here is broken by rocks that are exposed at low tide, and the coastline is quieter than in town.

## Homes in Inani

Villas and resort-style residences, some with direct beach access, and a small number of apartment developments.`,
    heroImage: placeImages.coxsBazar[2]!,
    highlights: [{ title: "Quiet coastline", text: "Fewer crowds than the beaches in town." }],
    lifestyle: ["Beach walks", "Sunsets over the bay"],
    nearby: ["Marine Drive", "Himchhari"],
    marketNotes: "",
    faqs: [],
    center: { lat: 21.2333, lng: 92.045 },
    zoom: 13,
    sortOrder: 1,
  },
  {
    kind: "neighbourhood",
    slug: "kolatoli",
    parentSlug: "coxs-bazar",
    name: "Kolatoli",
    headline: "Sea-view apartments in town",
    intro:
      "The hotel and resort district of Cox's Bazar, with sea-view apartments close to the beach.",
    body: `Kolatoli is the main hotel and resort district in Cox's Bazar town. Apartments here are popular as holiday homes and short-let investments thanks to their proximity to the beach.`,
    heroImage: placeImages.coxsBazar[0]!,
    highlights: [{ title: "Beach access", text: "A short walk to the main beach." }],
    lifestyle: ["Beach", "Restaurants", "Resorts"],
    nearby: ["Laboni beach", "Sugandha beach"],
    marketNotes: "",
    faqs: [],
    center: { lat: 21.412, lng: 92.01 },
    zoom: 14,
    sortOrder: 2,
  },
  {
    kind: "city",
    slug: "sylhet",
    parentSlug: "",
    name: "Sylhet",
    headline: "Retreats in tea country",
    intro:
      "A green, hilly region known for its tea estates, where buyers look for garden houses and weekend retreats.",
    body: `Sylhet is the centre of Bangladesh's tea-growing region. Rolling hills, tea gardens and a slower pace make it popular for second homes and family retreats.

## Homes in Sylhet

Detached houses and bungalows with gardens, often on larger plots than are available in the major cities.`,
    heroImage: placeImages.sylhet[0]!,
    highlights: [
      { title: "Tea estates", text: "Surrounded by some of the country's best-known tea gardens." },
      { title: "Space", text: "Larger plots and gardens." },
    ],
    lifestyle: ["Tea gardens", "Hills", "Quiet roads"],
    nearby: ["Osmani International Airport", "Ratargul", "Jaflong"],
    marketNotes:
      "Figures on this page are calculated from listings currently published on this site, not from market-wide transaction data.",
    faqs: [],
    center: { lat: 24.8949, lng: 91.8687 },
    zoom: 12,
    sortOrder: 4,
  },
];
