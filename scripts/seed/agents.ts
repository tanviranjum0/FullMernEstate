/**
 * Fictional advisors for development. They have no photographs (the UI renders a monogram)
 * so no real person's likeness is attached to an invented profile.
 */
export const seedAgents = [
  {
    slug: "ayesha-rahman",
    name: "Ayesha Rahman",
    title: "Senior Advisor, Gulshan & Baridhara",
    bio: `Ayesha advises buyers and sellers of lakeside apartments and penthouses across Gulshan, Banani and Baridhara.

She works closely with diplomatic households and relocating families, and is known for preparing clear, well-documented sales that move smoothly from offer to registration.`,
    email: "ayesha.rahman@example.com",
    languages: ["English", "Bangla"],
    specialties: ["Penthouses", "Lakeside apartments", "Diplomatic rentals"],
    areas: ["gulshan", "baridhara", "banani"],
    sortOrder: 1,
  },
  {
    slug: "farhan-chowdhury",
    name: "Farhan Chowdhury",
    title: "Advisor, Banani & Bashundhara",
    bio: `Farhan specialises in family homes and newer developments in Banani and Bashundhara.

Before joining the advisory team he worked in construction project management, and he helps buyers assess specifications, finishes and building services before they commit.`,
    email: "farhan.chowdhury@example.com",
    languages: ["English", "Bangla", "Hindi"],
    specialties: ["New developments", "Family homes", "Lettings"],
    areas: ["banani", "bashundhara"],
    sortOrder: 2,
  },
  {
    slug: "nadia-karim",
    name: "Nadia Karim",
    title: "Advisor, Coastal & Chattogram",
    bio: `Nadia looks after homes on the coast at Cox's Bazar and in Chattogram's hillside neighbourhoods.

Many of her clients are buying a second home from Dhaka or abroad, and she coordinates viewings, local due diligence and handover so that purchases can be managed remotely.`,
    email: "nadia.karim@example.com",
    languages: ["English", "Bangla", "Chittagonian"],
    specialties: ["Holiday homes", "Villas", "Remote purchases"],
    areas: ["inani", "kolatoli", "khulshi", "nasirabad"],
    sortOrder: 3,
  },
  {
    slug: "imran-hossain",
    name: "Imran Hossain",
    title: "Advisor, Dhanmondi & Sylhet",
    bio: `Imran advises on established homes in Dhanmondi and on retreats in Sylhet's tea country.

He has a particular interest in older houses with character and helps buyers think through renovation, restoration and long-term maintenance.`,
    email: "imran.hossain@example.com",
    languages: ["English", "Bangla", "Sylheti"],
    specialties: ["Character homes", "Renovation projects", "Country retreats"],
    areas: ["dhanmondi", "sylhet"],
    sortOrder: 4,
  },
] as const;

export type SeedAgentSlug = (typeof seedAgents)[number]["slug"];
