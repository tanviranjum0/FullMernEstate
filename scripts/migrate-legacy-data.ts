/**
 * Migrates users and listings from the legacy MERN app's MongoDB into this platform.
 *
 *   LEGACY_MONGODB_URI=<legacy uri> npm run db:migrate-legacy               # dry run (default)
 *   LEGACY_MONGODB_URI=<legacy uri> npm run db:migrate-legacy -- --apply    # write
 *
 * Options
 *   --currency=USD          currency of legacy prices (the legacy UI displayed "$")
 *   --property-type=apartment
 *                           the legacy app had no property type; every listing gets this value
 *   --default-city=<slug>   city for listings whose address names no known location
 *                           (without it those listings are skipped and reported)
 *   --allow-remote          required when MONGODB_URI is not a local database; also requires
 *                           MIGRATE_CONFIRM=<target database name>
 *
 * Safety
 *   - The legacy database is only read.
 *   - The target is insert-only: existing users (matched by email) and already-migrated listings
 *     (matched by legacy id) are skipped, so re-running is safe and nothing is overwritten or deleted.
 *   - Every migrated listing is created as a draft for an editor to review before publishing.
 *   - Users keep their bcrypt password hash (verified at sign-in). Hashes the legacy app corrupted
 *     are not copied; those users set a password through "Forgot password".
 *   - The report written to .data/migrations/ contains ids and reasons only — no emails or hashes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import { MongoClient, type Db } from "mongodb";
import { LISTING_TYPES, PROPERTY_TYPES, SUPPORTED_CURRENCIES, type CurrencyCode } from "../src/config/property-options";
import { slugify } from "../src/lib/slug";
import { RESERVED_SLUGS } from "../src/lib/validation/admin";
import { LocationModel } from "../src/server/models/location";
import { PropertyModel } from "../src/server/models/property";
import { connectScriptDatabase, describeHost, hasFlag, readOption, requireEnv } from "./lib/script-db";

interface LegacyImage {
  secure_url?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface LegacyUser {
  _id: Types.ObjectId;
  username?: string;
  email?: string;
  password?: unknown;
  avatar?: LegacyImage | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LegacyListing {
  _id: Types.ObjectId;
  name?: string;
  description?: string;
  address?: string;
  regularPrice?: number;
  discountPrice?: number;
  bathrooms?: number;
  bedrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  type?: string;
  offer?: boolean;
  imageUrls?: LegacyImage[] | null;
  userRef?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

type Outcome = { legacyId: string; result: "migrated" | "skipped"; reason?: string; notes?: string[]; newId?: string };

const BCRYPT_HASH = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const CLOUDINARY_URL = /^https:\/\/res\.cloudinary\.com\/[^\s]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const apply = hasFlag("--apply");

function databaseName(uri: string): string {
  const pathPart = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+/, "").split("?")[0] ?? "";
  return pathPart.replace(/^\//, "") || "test";
}

function clampInt(value: unknown, min: number, max: number): number {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

function cloudinaryImage(image: LegacyImage | null | undefined) {
  const src = image?.secure_url ?? image?.url?.replace(/^http:/, "https:");
  if (!src || !CLOUDINARY_URL.test(src)) return null;
  const width = Number(image?.width);
  const height = Number(image?.height);
  if (!(width > 0 && height > 0)) return null;
  return { src, width: Math.round(width), height: Math.round(height) };
}

/* ----------------------------------------------------------------------------------------------
 * Users → Better Auth `user` + credential `account`
 * --------------------------------------------------------------------------------------------*/

async function migrateUsers(legacy: Db, target: Db): Promise<{ outcomes: Outcome[]; idMap: Map<string, string> }> {
  const outcomes: Outcome[] = [];
  const idMap = new Map<string, string>();
  const users = await legacy.collection<LegacyUser>("users").find({}).toArray();

  for (const user of users) {
    const legacyId = user._id.toString();
    const email = String(user.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) {
      outcomes.push({ legacyId, result: "skipped", reason: "missing or invalid email" });
      continue;
    }
    const existing = await target.collection("user").findOne({ $or: [{ email }, { legacyUserId: legacyId }] }, { projection: { _id: 1 } });
    if (existing) {
      idMap.set(legacyId, existing._id.toString());
      outcomes.push({ legacyId, result: "skipped", reason: "an account with this email already exists", newId: existing._id.toString() });
      continue;
    }

    const notes: string[] = [];
    const hash = typeof user.password === "string" && BCRYPT_HASH.test(user.password) ? user.password : null;
    if (!hash) notes.push("password hash unusable (legacy update bug); user must reset their password");
    const avatarUrl = user.avatar?.secure_url;
    const avatar = avatarUrl && CLOUDINARY_URL.test(avatarUrl) ? avatarUrl : undefined;

    const userId = new Types.ObjectId();
    const now = new Date();
    const userDocument = {
      _id: userId,
      name: String(user.username ?? "").trim().slice(0, 120) || email.split("@")[0],
      email,
      emailVerified: false,
      ...(avatar ? { image: avatar } : {}),
      role: "user",
      disabled: false,
      legacyUserId: legacyId,
      createdAt: user.createdAt ?? now,
      updatedAt: user.updatedAt ?? now,
    };

    if (apply) {
      await target.collection("user").insertOne(userDocument);
      if (hash) {
        await target.collection("account").insertOne({
          _id: new Types.ObjectId(),
          accountId: userId.toString(),
          providerId: "credential",
          userId,
          password: hash,
          createdAt: userDocument.createdAt,
          updatedAt: now,
        });
      }
    }
    idMap.set(legacyId, userId.toString());
    outcomes.push({ legacyId, result: "migrated", newId: userId.toString(), notes });
  }
  return { outcomes, idMap };
}

/* ----------------------------------------------------------------------------------------------
 * Listings → draft properties
 * --------------------------------------------------------------------------------------------*/

interface KnownLocation {
  kind: "city" | "neighbourhood";
  slug: string;
  name: string;
  parentSlug: string;
}

function matchLocation(address: string, locations: KnownLocation[], defaultCity: KnownLocation | undefined) {
  const haystack = ` ${address.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const mentions = (location: KnownLocation) => haystack.includes(` ${location.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `);
  const cities = locations.filter((location) => location.kind === "city");
  const neighbourhood = locations.find((location) => location.kind === "neighbourhood" && mentions(location));
  if (neighbourhood) {
    const city = cities.find((candidate) => candidate.slug === neighbourhood.parentSlug);
    if (city) return { city, neighbourhood, assumed: false };
  }
  const city = cities.find(mentions);
  if (city) return { city, neighbourhood: undefined, assumed: false };
  return defaultCity ? { city: defaultCity, neighbourhood: undefined, assumed: true } : null;
}

async function allocateSlug(title: string, taken: Set<string>): Promise<string> {
  const base = slugify(title);
  for (let attempt = 1; attempt < 500; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (RESERVED_SLUGS.has(candidate) || taken.has(candidate)) continue;
    if (!(await PropertyModel.exists({ slug: candidate }))) {
      taken.add(candidate);
      return candidate;
    }
  }
  throw new Error(`Could not allocate a slug for “${title}”`);
}

async function migrateListings(
  legacy: Db,
  userIds: Map<string, string>,
  options: { currency: CurrencyCode; propertyType: (typeof PROPERTY_TYPES)[number]; defaultCitySlug?: string },
): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  const locations = (await LocationModel.find({}, { kind: 1, slug: 1, name: 1, parentSlug: 1 }).lean()).map((location) => ({
    kind: location.kind as KnownLocation["kind"],
    slug: location.slug,
    name: location.name,
    parentSlug: location.parentSlug ?? "",
  }));
  const defaultCity = options.defaultCitySlug ? locations.find((l) => l.kind === "city" && l.slug === options.defaultCitySlug) : undefined;
  if (options.defaultCitySlug && !defaultCity) throw new Error(`--default-city=${options.defaultCitySlug} is not a city in the target database`);

  const takenSlugs = new Set<string>();
  const listings = await legacy.collection<LegacyListing>("listings").find({}).sort({ createdAt: 1 }).toArray();

  for (const listing of listings) {
    const legacyId = listing._id.toString();
    if (await PropertyModel.exists({ "legacy.listingId": legacyId })) {
      outcomes.push({ legacyId, result: "skipped", reason: "already migrated" });
      continue;
    }
    const title = String(listing.name ?? "").trim().slice(0, 140);
    const listingType = LISTING_TYPES.find((type) => type === listing.type);
    const regular = Number(listing.regularPrice);
    if (title.length < 4) {
      outcomes.push({ legacyId, result: "skipped", reason: "missing title" });
      continue;
    }
    if (!listingType) {
      outcomes.push({ legacyId, result: "skipped", reason: `unknown listing type “${String(listing.type)}”` });
      continue;
    }
    if (!(regular > 0)) {
      outcomes.push({ legacyId, result: "skipped", reason: "missing price" });
      continue;
    }
    const address = String(listing.address ?? "").trim().slice(0, 200);
    const place = matchLocation(address, locations, defaultCity);
    if (!place) {
      outcomes.push({ legacyId, result: "skipped", reason: "address does not name a known city; pass --default-city=<slug>" });
      continue;
    }

    const notes = [`property type set to “${options.propertyType}” (not recorded by the legacy app)`, "image alt text needs review"];
    if (place.assumed) notes.push(`city assumed from --default-city (${place.city.slug})`);
    const description = String(listing.description ?? "").trim().slice(0, 12_000);
    if (description.length < 40) notes.push("description shorter than 40 characters; expand before publishing");

    const discount = Number(listing.discountPrice);
    const onOffer = Boolean(listing.offer) && discount > 0 && discount < regular;
    const legacyImages = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
    const images = legacyImages
      .map(cloudinaryImage)
      .filter((image): image is NonNullable<typeof image> => image !== null)
      .slice(0, 60)
      .map((image, index) => ({ ...image, alt: `${title} — photograph ${index + 1}`, caption: "", blurDataURL: "", storageKey: "" }));
    if (images.length < legacyImages.length) notes.push(`${legacyImages.length - images.length} image(s) skipped (not a Cloudinary URL or missing dimensions)`);
    if (images.length === 0) notes.push("no usable photographs; add some before publishing");

    const ownerId = listing.userRef?.toString() ?? "";
    const slug = await allocateSlug(title, takenSlugs);
    const document = {
      slug,
      title,
      headline: "",
      description: description || title,
      status: "draft" as const,
      listingType,
      propertyType: options.propertyType,
      availability: "available" as const,
      price: { amount: onOffer ? discount : regular, currency: options.currency, ...(onOffer ? { previousAmount: regular } : {}), onRequest: false },
      specs: {
        bedrooms: clampInt(listing.bedrooms, 0, 50),
        bathrooms: clampInt(listing.bathrooms, 0, 50),
        parkingSpaces: listing.parking ? 1 : 0,
        furnishing: listing.furnished ? ("furnished" as const) : ("unfurnished" as const),
      },
      amenities: [],
      flags: { featured: false, exclusive: false, newConstruction: false },
      location: {
        citySlug: place.city.slug,
        cityName: place.city.name,
        ...(place.neighbourhood ? { neighbourhoodSlug: place.neighbourhood.slug, neighbourhoodName: place.neighbourhood.name } : {}),
        displayAddress: address,
        addressLine: "",
        showExactLocation: false,
      },
      images,
      floorPlans: [],
      createdBy: userIds.get(ownerId) ?? "",
      updatedBy: "legacy-migration",
      legacy: { listingId: legacyId, ownerId },
      createdAt: listing.createdAt ?? new Date(),
      updatedAt: listing.updatedAt ?? new Date(),
    };

    let newId: string | undefined;
    if (apply) {
      // `timestamps: false` keeps the legacy creation dates instead of stamping "now".
      const [created] = await PropertyModel.create([document], { timestamps: false });
      newId = created!._id.toString();
    }
    outcomes.push({ legacyId, result: "migrated", newId, notes });
  }
  return outcomes;
}

/* ----------------------------------------------------------------------------------------------
 * Entry point
 * --------------------------------------------------------------------------------------------*/

async function main() {
  const targetUri = requireEnv("MONGODB_URI");
  const legacyUri = requireEnv("LEGACY_MONGODB_URI");
  const target = describeHost(targetUri);
  const source = describeHost(legacyUri);
  const targetDb = databaseName(targetUri);
  const sourceDb = databaseName(legacyUri);

  if (target.host === source.host && targetDb === sourceDb) {
    console.error("LEGACY_MONGODB_URI and MONGODB_URI point at the same database. Refusing to continue.");
    process.exit(1);
  }
  if (apply && !target.isLocal) {
    if (!hasFlag("--allow-remote") || process.env.MIGRATE_CONFIRM !== targetDb) {
      console.error(`Target ${target.host}/${targetDb} is not local. Re-run with --allow-remote and MIGRATE_CONFIRM=${targetDb}.`);
      process.exit(1);
    }
  }

  const currency = (readOption("currency") ?? "USD").toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency as CurrencyCode)) {
    console.error(`--currency must be one of ${SUPPORTED_CURRENCIES.join(", ")}`);
    process.exit(1);
  }
  const propertyType = readOption("property-type") ?? "apartment";
  if (!PROPERTY_TYPES.includes(propertyType as (typeof PROPERTY_TYPES)[number])) {
    console.error(`--property-type must be one of ${PROPERTY_TYPES.join(", ")}`);
    process.exit(1);
  }

  console.log(`${apply ? "APPLYING" : "DRY RUN"}: ${source.host}/${sourceDb} → ${target.host}/${targetDb}`);
  const legacyClient = new MongoClient(legacyUri, { serverSelectionTimeoutMS: 10_000, readPreference: "secondaryPreferred" });
  await legacyClient.connect();
  await connectScriptDatabase(targetUri);

  try {
    const legacyDb = legacyClient.db(sourceDb);
    const users = await migrateUsers(legacyDb, mongoose.connection.db!);
    const listings = await migrateListings(legacyDb, users.idMap, {
      currency: currency as CurrencyCode,
      propertyType: propertyType as (typeof PROPERTY_TYPES)[number],
      defaultCitySlug: readOption("default-city"),
    });

    const summarise = (label: string, outcomes: Outcome[]) => {
      const migrated = outcomes.filter((o) => o.result === "migrated").length;
      console.log(`  ${label.padEnd(9)} ${migrated} ${apply ? "migrated" : "to migrate"}, ${outcomes.length - migrated} skipped`);
      for (const outcome of outcomes.filter((o) => o.result === "skipped")) console.log(`    skip ${outcome.legacyId}: ${outcome.reason}`);
    };
    summarise("Users", users.outcomes);
    summarise("Listings", listings);

    const reportDir = path.join(process.cwd(), ".data", "migrations");
    await mkdir(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, `legacy-${apply ? "applied" : "dry-run"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await writeFile(reportPath, JSON.stringify({ applied: apply, source: `${source.host}/${sourceDb}`, target: `${target.host}/${targetDb}`, users: users.outcomes, listings }, null, 2));
    console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);
    if (!apply) console.log("Nothing was written. Re-run with --apply to migrate.");
    else console.log("Migrated listings are drafts: review them in /admin/properties before publishing.");
  } finally {
    await legacyClient.close();
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
