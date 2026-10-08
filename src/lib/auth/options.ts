import bcrypt from "bcryptjs";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { ObjectId, type MongoClient } from "mongodb";

export interface AuthOptionsInput {
  client: MongoClient;
  appName: string;
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  secureCookies: boolean;
  sendResetPassword?: (data: {
    user: { email: string; name: string };
    url: string;
  }) => Promise<void>;
  plugins?: BetterAuthPlugin[];
}

/**
 * Framework-neutral Better Auth configuration shared by the Next.js app and CLI scripts, so
 * an account created by a script is indistinguishable from one created through the UI.
 */
export function createAuthOptions(input: AuthOptionsInput) {
  const db = input.client.db();
  return {
    appName: input.appName,
    baseURL: input.baseURL,
    secret: input.secret,
    trustedOrigins: input.trustedOrigins,
    database: mongodbAdapter(db, { client: input.client }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      password: {
        hash: hashPassword,
        // Accounts migrated from the legacy app keep their bcrypt hashes until the next reset.
        verify: async ({ hash, password }: { hash: string; password: string }) =>
          hash.startsWith("$2")
            ? bcrypt.compare(password, hash)
            : verifyPassword({ hash, password }),
      },
      sendResetPassword: input.sendResetPassword,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "user", input: false },
        disabled: { type: "boolean", required: false, defaultValue: false, input: false },
        phone: { type: "string", required: false, input: true },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 60, max: 5 },
        "/request-password-reset": { window: 60 * 15, max: 3 },
        "/reset-password": { window: 60 * 15, max: 5 },
        "/change-password": { window: 60 * 15, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "tdp",
      useSecureCookies: input.secureCookies,
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session: { userId: string | ObjectId }) => {
            const user = await db
              .collection("user")
              .findOne(
                { _id: new ObjectId(String(session.userId)) },
                { projection: { disabled: 1 } },
              );
            if (user?.disabled) {
              throw new APIError("FORBIDDEN", {
                message: "This account has been disabled. Please contact us for assistance.",
              });
            }
          },
        },
      },
    },
    plugins: input.plugins ?? [],
  } satisfies BetterAuthOptions;
}
