/**
 * Seeds clearly-labelled DEVELOPMENT data: locations, advisors, listings, articles and site
 * settings (including a visible "demonstration site" announcement).
 *
 *   npm run db:seed                 # refuses if listings already exist
 *   npm run db:seed -- --reset      # wipes catalogue collections first (local databases only)
 *
 * Safety: refuses to run against a non-local database or with NODE_ENV=production unless
 * `--allow-remote` is passed explicitly together with SEED_CONFIRM=demo-data.
 */
import mongoose, { Types } from "mongoose";
import { slugify } from "../src/lib/slug";
import { readingTimeMinutes } from "../src/lib/format";
import { AgentModel } from "../src/server/models/agent";
import { ArticleModel } from "../src/server/models/article";
import { InquiryModel } from "../src/server/models/inquiry";
import { LocationModel } from "../src/server/models/location";
import { PropertyModel } from "../src/server/models/property";
import { SiteSettingsModel } from "../src/server/models/site-settings";
import { connectScriptDatabase, describeHost, hasFlag, requireEnv } from "./lib/script-db";
import { seedAgents } from "./seed/agents";
import { seedArticles, seedSiteSettings } from "./seed/articles";
import { seedLocations } from "./seed/locations";
import { seedProperties } from "./seed/properties";

const DAY = 86_400_000;

async function main() {
  const uri = requireEnv("MONGODB_URI");
  const { host, isLocal } = describeHost(uri);
  const allowRemote = hasFlag("--allow-remote") && process.env.SEED_CONFIRM === "demo-data";

  if ((!isLocal || process.env.NODE_ENV === "production") && !allowRemote) {
    console.error(
      `Refusing to seed ${host}: development data is only written to local databases.\n` +
        "To load the labelled demo dataset elsewhere, pass --allow-remote and set SEED_CONFIRM=demo-data.",
    );
    process.exit(1);
  }

  await connectScriptDatabase(uri);
  console.log(`Connected to ${host}`);

  const existing = await PropertyModel.estimatedDocumentCount();
  if (existing > 0 && !hasFlag("--reset")) {
    console.error(
      `The database already has ${existing} listings. Re-run with --reset to replace them.`,
    );
    process.exit(1);
  }
  if (hasFlag("--reset")) {
    if (!isLocal) {
      console.error("--reset is only permitted on local databases.");
      process.exit(1);
    }
    await Promise.all([
      PropertyModel.deleteMany({}),
      AgentModel.deleteMany({}),
      LocationModel.deleteMany({}),
      ArticleModel.deleteMany({}),
      SiteSettingsModel.deleteMany({}),
      InquiryModel.deleteMany({}),
    ]);
    console.log("Cleared catalogue collections.");
  }

  await Promise.all([
    LocationModel.syncIndexes(),
    AgentModel.syncIndexes(),
    PropertyModel.syncIndexes(),
    ArticleModel.syncIndexes(),
    SiteSettingsModel.syncIndexes(),
  ]);

  await LocationModel.insertMany(
    seedLocations.map((location) => ({ ...location, published: true })),
  );
  console.log(`Locations: ${seedLocations.length}`);

  const agents = await AgentModel.insertMany(
    seedAgents.map((agent) => ({ ...agent, active: true })),
  );
  const agentIds = new Map(agents.map((agent) => [agent.slug, agent._id as Types.ObjectId]));
  console.log(`Advisors: ${agents.length}`);

  const locationNames = new Map(seedLocations.map((location) => [location.slug, location.name]));
  const now = Date.now();
  await PropertyModel.insertMany(
    seedProperties.map((property) => {
      const publishedAt = new Date(now - property.daysAgo * DAY);
      return {
        slug: slugify(property.title),
        title: property.title,
        headline: property.headline,
        description: property.description,
        status: "published",
        listingType: property.listingType,
        propertyType: property.propertyType,
        availability: property.availability ?? "available",
        price: {
          amount: Math.round(property.price),
          currency: "BDT",
          previousAmount: property.previousPrice ? Math.round(property.previousPrice) : undefined,
          onRequest: Boolean(property.onRequest),
        },
        specs: {
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          areaSqft: property.areaSqft,
          landAreaSqft: property.landAreaSqft,
          parkingSpaces: property.parking,
          yearBuilt: property.yearBuilt,
          floors: property.floors,
          floorLevel: property.floorLevel,
          furnishing: property.furnishing,
        },
        amenities: property.amenities,
        flags: {
          featured: Boolean(property.featured),
          exclusive: Boolean(property.exclusive),
          newConstruction: Boolean(property.newConstruction),
        },
        location: {
          citySlug: property.city,
          cityName: locationNames.get(property.city) ?? property.city,
          neighbourhoodSlug: property.neighbourhood,
          neighbourhoodName: property.neighbourhood
            ? (locationNames.get(property.neighbourhood) ?? "")
            : "",
          displayAddress: property.displayAddress,
          showExactLocation: Boolean(property.showExactLocation),
          geo: { type: "Point", coordinates: [property.coordinates[1], property.coordinates[0]] },
        },
        images: property.images,
        agent: agentIds.get(property.agent),
        publishedAt,
        priceChangedAt: property.previousPrice ? new Date(now - 2 * DAY) : undefined,
        createdBy: "seed",
        updatedBy: "seed",
        createdAt: new Date(publishedAt.getTime() - 3 * DAY),
        updatedAt: publishedAt,
      };
    }),
  );
  console.log(`Listings: ${seedProperties.length}`);

  await ArticleModel.insertMany(
    seedArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      category: article.category,
      author: article.author ? agentIds.get(article.author) : undefined,
      coverImage: article.coverImage,
      tags: article.tags,
      relatedLocationSlugs: article.relatedLocationSlugs,
      status: "published",
      featured: article.featured,
      readingMinutes: readingTimeMinutes(article.body),
      publishedAt: new Date(now - article.daysAgo * DAY),
      createdBy: "seed",
      updatedBy: "seed",
    })),
  );
  console.log(`Articles: ${seedArticles.length}`);

  await SiteSettingsModel.findOneAndUpdate(
    { key: "global" },
    { $set: { key: "global", ...seedSiteSettings, updatedBy: "seed" } },
    { upsert: true },
  );
  console.log("Site settings: written (with demonstration-data announcement)");

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
