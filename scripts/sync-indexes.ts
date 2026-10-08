/**
 * Creates/updates every collection index declared in the Mongoose models, plus the indexes Better
 * Auth declares for its own collections (its MongoDB adapter does not create them). Production
 * runs with `autoIndex` disabled, so run this after schema changes:  npm run db:indexes
 */
import mongoose from "mongoose";
import { AgentModel } from "../src/server/models/agent";
import { ArticleModel } from "../src/server/models/article";
import { InquiryModel } from "../src/server/models/inquiry";
import { LocationModel } from "../src/server/models/location";
import { PropertyModel } from "../src/server/models/property";
import { SiteSettingsModel } from "../src/server/models/site-settings";
import { AuditLogModel, DailyMetricModel, RateLimitModel } from "../src/server/models/system";
import { FavoriteModel, RecentViewModel, SavedSearchModel } from "../src/server/models/user-data";
import { connectScriptDatabase, describeHost, requireEnv } from "./lib/script-db";

const models = [
  PropertyModel,
  AgentModel,
  LocationModel,
  ArticleModel,
  InquiryModel,
  SiteSettingsModel,
  FavoriteModel,
  SavedSearchModel,
  RecentViewModel,
  AuditLogModel,
  RateLimitModel,
  DailyMetricModel,
];

/** Mirrors the unique/indexed fields in Better Auth's schema, plus TTL clean-up of expired rows. */
const AUTH_INDEXES: {
  collection: string;
  key: Record<string, 1>;
  options: { name: string; unique?: boolean; expireAfterSeconds?: number };
}[] = [
  { collection: "user", key: { email: 1 }, options: { name: "email_unique", unique: true } },
  { collection: "session", key: { token: 1 }, options: { name: "token_unique", unique: true } },
  { collection: "session", key: { userId: 1 }, options: { name: "userId" } },
  {
    collection: "session",
    key: { expiresAt: 1 },
    options: { name: "expiresAt_ttl", expireAfterSeconds: 0 },
  },
  { collection: "account", key: { userId: 1 }, options: { name: "userId" } },
  { collection: "verification", key: { identifier: 1 }, options: { name: "identifier" } },
  {
    collection: "verification",
    key: { expiresAt: 1 },
    options: { name: "expiresAt_ttl", expireAfterSeconds: 0 },
  },
  { collection: "rateLimit", key: { key: 1 }, options: { name: "key_unique", unique: true } },
];

async function main() {
  const uri = requireEnv("MONGODB_URI");
  await connectScriptDatabase(uri);
  console.log(`Syncing indexes on ${describeHost(uri).host}`);
  for (const model of models) {
    const dropped = await model.syncIndexes();
    const indexes = await model.listIndexes();
    console.log(
      `  ${model.modelName.padEnd(14)} ${indexes.length} indexes${dropped.length ? ` (dropped: ${dropped.join(", ")})` : ""}`,
    );
  }

  const db = mongoose.connection.db!;
  for (const { collection, key, options } of AUTH_INDEXES) {
    await db.collection(collection).createIndex(key, options);
  }
  console.log(`  ${"Better Auth".padEnd(14)} ${AUTH_INDEXES.length} indexes ensured`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
