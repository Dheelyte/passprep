import { defineConfig } from "vitest/config";
import path from "node:path";

const root = import.meta.dirname;

// Integration tests hit the real dev database (docker compose) and a local mock Paystack.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "server-only": path.resolve(root, "tests/server-only-stub.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      FREE_DAILY_LIMIT: "3",
      PAYSTACK_SECRET_KEY: "sk_test_integration",
      PAYSTACK_API_BASE: "http://localhost:3198",
      MOCK_PAYSTACK_PORT: "3198",
      APP_URL: "http://localhost:3100",
    },
  },
});
