import { afterAll, vi } from "vitest";
import { TEST_MONGODB_URI } from "./test-database";
import { testSession } from "./session-state";

process.env.MONGODB_URI = TEST_MONGODB_URI;
process.env.BETTER_AUTH_SECRET = "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.MEDIA_STORAGE = "local";
delete process.env.RESEND_API_KEY;
delete process.env.BLOB_READ_WRITE_TOKEN;

/*
 * Only the Next.js request/runtime APIs are replaced. Services, actions, models and the database
 * are the real ones.
 */
vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": testSession.ip, "user-agent": "vitest" }),
  cookies: async () => ({ get: () => undefined, getAll: () => [], has: () => false }),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  // Background work (emails, media clean-up) is not part of these assertions.
  after: vi.fn(),
}));

vi.mock("@/lib/auth/session", async () => {
  const { hasPermission } = await import("@/lib/auth/permissions");
  const getCurrentUser = async () => testSession.user;
  return {
    getCurrentUser,
    requireUser: async () => {
      if (!testSession.user) throw new Error("NEXT_REDIRECT: sign-in required");
      return testSession.user;
    },
    authorize: async (permission: Parameters<typeof hasPermission>[1]) => {
      const user = testSession.user;
      if (!user) return { ok: false, reason: "unauthenticated" };
      if (!hasPermission(user.role, permission)) return { ok: false, reason: "forbidden" };
      return { ok: true, user };
    },
  };
});

afterAll(async () => {
  testSession.user = null;
  // Each test file gets a fresh module graph but shares `globalThis`, so drop the cached
  // connection objects that the app keeps there.
  const store = globalThis as Record<string, unknown>;
  const client = store.__mongoClient as { close: () => Promise<void> } | undefined;
  await client?.close();
  delete store.__mongoClient;
  delete store.__mongoConnecting;
  delete store.__mongooseReady;
  delete store.__betterAuth;
});
