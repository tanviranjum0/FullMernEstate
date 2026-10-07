/**
 * Creates/updates every collection index declared in the Mongoose models. Production runs with
 * `autoIndex` disabled, so run this after schema changes:  npm run db:indexes
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
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
