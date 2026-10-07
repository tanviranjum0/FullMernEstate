import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { siteConfig } from "@/config/site";
import { getMongoClient } from "@/lib/db/client";
import { escapeHtml, sendEmail } from "@/lib/email/send";
import { getServerEnv, isEmailConfigured } from "@/lib/env";
import { createAuthOptions } from "./options";

function createAuth() {
  const env = getServerEnv();
  const baseURL = env.BETTER_AUTH_URL ?? siteConfig.url;

  return betterAuth(
    createAuthOptions({
      client: getMongoClient(),
      appName: siteConfig.name,
      baseURL,
      secret: env.BETTER_AUTH_SECRET,
      trustedOrigins: [...new Set([baseURL, siteConfig.url])],
      secureCookies: process.env.NODE_ENV === "production",
      sendResetPassword: isEmailConfigured()
        ? async ({ user, url }) => {
            await sendEmail({
              to: user.email,
              subject: `Reset your ${siteConfig.name} password`,
              text: `Hello ${user.name},\n\nUse the link below to choose a new password. It expires in one hour.\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
              html: `<p>Hello ${escapeHtml(user.name)},</p><p>Use the link below to choose a new password. It expires in one hour.</p><p><a href="${escapeHtml(url)}">Choose a new password</a></p><p>If you did not request this, you can ignore this email.</p>`,
            });
          }
        : undefined,
      plugins: [nextCookies()],
    }),
  );
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as typeof globalThis & { __betterAuth?: Auth };

export function getAuth(): Auth {
  globalForAuth.__betterAuth ??= createAuth();
  return globalForAuth.__betterAuth;
}
