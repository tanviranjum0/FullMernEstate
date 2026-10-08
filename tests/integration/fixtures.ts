import { Types } from "mongoose";
import type { UserRole } from "@/config/domain";
import type { CurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AgentModel } from "@/server/models/agent";
import { LocationModel } from "@/server/models/location";
import { PropertyModel } from "@/server/models/property";

/** Connects through the app's own connection code and empties the given collections. */
export async function freshDatabase(...collections: string[]) {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db!;
  await Promise.all(collections.map((name) => db.collection(name).deleteMany({})));
  return db;
}

export async function createLocations() {
  await LocationModel.create([
    { kind: "city", slug: "dhaka", name: "Dhaka", published: true },
    {
      kind: "neighbourhood",
      slug: "gulshan",
      parentSlug: "dhaka",
      name: "Gulshan",
      published: true,
    },
    { kind: "neighbourhood", slug: "banani", parentSlug: "dhaka", name: "Banani", published: true },
    { kind: "city", slug: "chattogram", name: "Chattogram", published: true },
  ]);
}

export async function createAgent(overrides: Record<string, unknown> = {}) {
  const slug = `advisor-${new Types.ObjectId().toString().slice(-6)}`;
  return AgentModel.create({
    slug,
    name: "Test Advisor",
    email: "advisor@example.test",
    active: true,
    ...overrides,
  });
}

let counter = 0;

/** Inserts a valid listing directly (bypassing the admin service) for read-side tests. */
export async function createProperty(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return PropertyModel.create({
    slug: `test-listing-${counter}-${new Types.ObjectId().toString().slice(-4)}`,
    title: `Test listing ${counter}`,
    description: "A listing created by the integration test suite with enough words to be valid.",
    status: "published",
    listingType: "sale",
    propertyType: "apartment",
    availability: "available",
    price: { amount: 10_000_000, currency: "BDT", onRequest: false },
    specs: { bedrooms: 3, bathrooms: 3, parkingSpaces: 1, areaSqft: 2000 },
    location: {
      citySlug: "dhaka",
      cityName: "Dhaka",
      neighbourhoodSlug: "gulshan",
      neighbourhoodName: "Gulshan",
    },
    images: [
      { src: "/media/property/test/w1920.webp", width: 1920, height: 1280, alt: "Test photo" },
    ],
    publishedAt: new Date(Date.now() - counter * 60_000),
    ...overrides,
  });
}

export function staff(role: UserRole, agentId: string | null = null): CurrentUser {
  return {
    id: new Types.ObjectId().toString(),
    name: `Test ${role}`,
    email: `${role}@example.test`,
    image: null,
    phone: null,
    role,
    agentId,
  };
}
