import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { MongoClient } from "mongodb";
import {
  assertLocalE2eDatabase,
  AUTH_STATE,
  E2E_ACCOUNTS,
  E2E_BASE_URL,
  E2E_MONGODB_URI,
} from "./environment";

/** Per-run state; the catalogue itself is seeded once, before the server is built. */
const VOLATILE_COLLECTIONS = [
  "user",
  "account",
  "session",
  "verification",
  "rateLimit",
  "rate_limits",
  "favorites",
  "saved_searches",
  "recent_views",
  "inquiries",
  "audit_logs",
  "daily_metrics",
];

export default async function globalSetup() {
  assertLocalE2eDatabase(E2E_MONGODB_URI);
  const client = new MongoClient(E2E_MONGODB_URI);
  await client.connect();
  const db = client.db();
  await Promise.all(VOLATILE_COLLECTIONS.map((name) => db.collection(name).deleteMany({})));
  // Listings created by a previous run of the admin journey.
  await db.collection("properties").deleteMany({ title: /^E2E / });

  await mkdir(path.dirname(AUTH_STATE.admin), { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [key, account] of Object.entries(E2E_ACCOUNTS) as [
      keyof typeof E2E_ACCOUNTS,
      (typeof E2E_ACCOUNTS)[keyof typeof E2E_ACCOUNTS],
    ][]) {
      const context = await browser.newContext({ baseURL: E2E_BASE_URL });
      const page = await context.newPage();
      await page.goto("/robots.txt");
      // Signing up through the real auth endpoint sets the session cookie in this browser context.
      const status = await page.evaluate(async ({ name, email, password }) => {
        const response = await fetch("/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        return response.status;
      }, account);
      if (status !== 200)
        throw new Error(`Could not create the ${key} test account (HTTP ${status}).`);
      if (account.role !== "user") {
        await db
          .collection("user")
          .updateOne({ email: account.email }, { $set: { role: account.role } });
      }
      await context.storageState({ path: AUTH_STATE[key] });
      await context.close();
    }
  } finally {
    await browser.close();
    await client.close();
  }
}
