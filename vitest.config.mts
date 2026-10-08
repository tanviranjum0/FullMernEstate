import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside a React Server environment; tests import server modules directly.
    alias: { "server-only": path.resolve(import.meta.dirname, "tests/setup/empty-module.ts") },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/setup/integration-global.ts"],
          setupFiles: ["tests/setup/integration-setup.ts"],
          // Files share one test database, so they run one at a time.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
