/**
 * Creates (or promotes) a staff account using the app's own Better Auth configuration.
 *
 *   npm run admin:create -- --email=you@company.com --name="Your Name"
 *   npm run admin:create -- --email=advisor@company.com --role=agent --agent=ayesha-rahman
 *
 * The password is read from ADMIN_PASSWORD; if absent a strong random password is generated
 * and written to the git-ignored file `.admin-credentials.local` (never printed).
 */
import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { createAuthOptions } from "../src/lib/auth/options";
import { describeHost, readOption, requireEnv } from "./lib/script-db";

const ROLES = ["user", "agent", "editor", "admin"] as const;

async function main() {
  const uri = requireEnv("MONGODB_URI");
  const secret = requireEnv("BETTER_AUTH_SECRET");
  const email = readOption("email")?.toLowerCase();
  const name = readOption("name") ?? "Site Administrator";
  const role = (readOption("role") ?? "admin") as (typeof ROLES)[number];
  const agentSlug = readOption("agent");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Pass a valid --email=address");
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`--role must be one of ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const baseURL =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const auth = betterAuth(
    createAuthOptions({
      client,
      appName: "TanvirDev Property",
      baseURL,
      secret,
      trustedOrigins: [baseURL],
      secureCookies: false,
    }),
  );

  const existing = await db.collection("user").findOne({ email });
  let generatedPassword: string | null = null;
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD ?? randomBytes(18).toString("base64url");
    if (!process.env.ADMIN_PASSWORD) generatedPassword = password;
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`Created account ${email}`);
  } else {
    console.log(`Account ${email} already exists; updating role only.`);
  }

  const user = await db.collection("user").findOne({ email });
  if (!user) throw new Error("User was not created");
  await db.collection("user").updateOne({ _id: user._id }, { $set: { role, disabled: false } });

  if (agentSlug) {
    const result = await db
      .collection("agents")
      .updateOne({ slug: agentSlug }, { $set: { userId: user._id.toString() } });
    console.log(
      result.matchedCount
        ? `Linked to advisor profile "${agentSlug}"`
        : `No advisor "${agentSlug}" found`,
    );
  }

  if (generatedPassword) {
    await appendFile(
      ".admin-credentials.local",
      `${new Date().toISOString()}  ${describeHost(uri).host}  ${role}  ${email}  ${generatedPassword}\n`,
      { mode: 0o600 },
    );
    console.log("Generated a password and saved it to .admin-credentials.local (git-ignored).");
  }
  console.log(`Role set to "${role}".`);
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
