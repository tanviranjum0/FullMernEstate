/**
 * Runs before the e2e server is built: loads the clearly-labelled demonstration catalogue into
 * the local `_e2e` database and creates indexes. The build then prerenders against this data.
 */
import { execSync } from "node:child_process";
import { assertLocalE2eDatabase } from "./environment";

const uri = process.env.MONGODB_URI ?? "";
assertLocalE2eDatabase(uri);

for (const command of [
  "npx tsx scripts/seed-development.ts --reset",
  "npx tsx scripts/sync-indexes.ts",
]) {
  execSync(command, { stdio: "inherit", env: process.env });
}
