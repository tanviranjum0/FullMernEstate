/**
 * Environment for the end-to-end server. Every value is local and disposable: a dedicated
 * `_e2e` database on the local MongoDB, a throwaway auth secret and local media storage.
 */
export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI ??
  "mongodb://localhost:27017/tanvirdev_property_e2e?replicaSet=rs0&directConnection=true";

export const E2E_ENV: Record<string, string> = {
  MONGODB_URI: E2E_MONGODB_URI,
  BETTER_AUTH_SECRET: "e2e-only-secret-e2e-only-secret-e2e-only",
  BETTER_AUTH_URL: E2E_BASE_URL,
  NEXT_PUBLIC_SITE_URL: E2E_BASE_URL,
  MEDIA_STORAGE: "local",
  NEXT_TELEMETRY_DISABLED: "1",
};

/** Test accounts created fresh for every run by global-setup.ts (they exist only in the e2e database). */
export const E2E_ACCOUNTS = {
  admin: {
    name: "E2E Administrator",
    email: "e2e-admin@example.test",
    password: "e2e-admin-password-1",
    role: "admin",
  },
  client: {
    name: "E2E Client",
    email: "e2e-client@example.test",
    password: "e2e-client-password-1",
    role: "user",
  },
} as const;

export const AUTH_STATE = {
  admin: "tests/e2e/.auth/admin.json",
  client: "tests/e2e/.auth/client.json",
} as const;

export function assertLocalE2eDatabase(uri: string): void {
  const host =
    uri
      .replace(/^mongodb(\+srv)?:\/\//, "")
      .split("@")
      .pop()!
      .split(/[/?]/)[0] ?? "";
  const local = host.split(",").every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h));
  const database = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, "").split("?")[0] ?? "";
  if (!local || !database.endsWith("_e2e")) {
    throw new Error(
      `E2E tests only run against a local database whose name ends in "_e2e" (got ${host}/${database}).`,
    );
  }
}
