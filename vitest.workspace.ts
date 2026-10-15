import { defineWorkspace } from "vitest/config";
import path from "node:path";

const alias = { "@": path.resolve(__dirname) };

export default defineWorkspace([
  {
    resolve: { alias },
    test: {
      name: "unit",
      include: ["tests/unit/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    resolve: { alias },
    test: {
      name: "integration",
      include: ["tests/integration/**/*.test.ts"],
      environment: "node",
      globalSetup: ["tests/setup/global-pg.ts"],
      setupFiles: ["tests/setup/env.ts"],
      pool: "forks",
      poolOptions: { forks: { singleFork: true } },
      testTimeout: 60_000,
      hookTimeout: 120_000,
    },
  },
]);
