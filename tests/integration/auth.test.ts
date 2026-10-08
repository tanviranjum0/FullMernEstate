import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { createAuthOptions } from "@/lib/auth/options";
import { getMongoClient } from "@/lib/db/client";
import { freshDatabase } from "./fixtures";

/*
 * Exercises the real Better Auth configuration used by the app (same options factory) against
 * the test database: hashing, legacy bcrypt verification, role protection and disabled accounts.
 */
const auth = () =>
  betterAuth(
    createAuthOptions({
      client: getMongoClient(),
      appName: "Test",
      baseURL: "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET!,
      trustedOrigins: ["http://localhost:3000"],
      secureCookies: false,
    }),
  );

const signIn = (email: string, password: string) => auth().api.signInEmail({ body: { email, password } });

describe("authentication", () => {
  let db: Awaited<ReturnType<typeof freshDatabase>>;

  beforeAll(async () => {
    db = await freshDatabase("user", "account", "session", "verification", "rateLimit");
  });

  it("creates client accounts with a modern hash and the default role", async () => {
    const result = await auth().api.signUpEmail({
      body: { name: "New Client", email: "New.Client@Example.test", password: "correct-horse-battery" },
    });
    expect(result.user.email).toBe("new.client@example.test");

    const user = await db.collection("user").findOne({ email: "new.client@example.test" });
    expect(user?.role).toBe("user");
    expect(user?.disabled).toBe(false);
    const account = await db.collection("account").findOne({ userId: user!._id, providerId: "credential" });
    expect(account?.password).toBeTypeOf("string");
    expect(account!.password.startsWith("$2")).toBe(false);
    expect(account!.password).not.toContain("correct-horse-battery");
  });

  it("refuses to let sign-up choose a staff role", async () => {
    await auth().api.signUpEmail({
      body: { name: "Sneaky", email: "sneaky@example.test", password: "correct-horse-battery", role: "admin" } as never,
    }).catch(() => undefined);
    const user = await db.collection("user").findOne({ email: "sneaky@example.test" });
    expect(user?.role ?? "user").toBe("user");
  });

  it("enforces the minimum password length", async () => {
    await expect(
      auth().api.signUpEmail({ body: { name: "Short", email: "short@example.test", password: "123456789" } }),
    ).rejects.toThrow();
  });

  it("signs in with the right password only", async () => {
    await expect(signIn("new.client@example.test", "correct-horse-battery")).resolves.toMatchObject({ token: expect.any(String) });
    await expect(signIn("new.client@example.test", "wrong-password-123")).rejects.toThrow();
    await expect(signIn("nobody@example.test", "correct-horse-battery")).rejects.toThrow();
  });

  it("accepts bcrypt hashes carried over from the legacy app", async () => {
    const userId = new ObjectId();
    const now = new Date();
    await db.collection("user").insertOne({ _id: userId, name: "Legacy", email: "legacy@example.test", emailVerified: false, role: "user", disabled: false, createdAt: now, updatedAt: now });
    await db.collection("account").insertOne({
      accountId: userId.toString(),
      providerId: "credential",
      userId,
      password: await bcrypt.hash("legacy-password-1", 10),
      createdAt: now,
      updatedAt: now,
    });
    await expect(signIn("legacy@example.test", "legacy-password-1")).resolves.toMatchObject({ token: expect.any(String) });
    await expect(signIn("legacy@example.test", "legacy-password-2")).rejects.toThrow();
  });

  it("blocks disabled accounts from signing in", async () => {
    await db.collection("user").updateOne({ email: "new.client@example.test" }, { $set: { disabled: true } });
    await expect(signIn("new.client@example.test", "correct-horse-battery")).rejects.toThrow(/disabled/i);
  });
});
