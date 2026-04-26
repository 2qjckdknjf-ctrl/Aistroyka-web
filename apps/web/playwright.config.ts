import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, "tests/e2e/_state", "auth.json");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: process.env.AUDIT_ARTIFACT_DIR ? "retain-on-failure" : "on-first-retry",
    screenshot: process.env.AUDIT_ARTIFACT_DIR ? "only-on-failure" : "off",
  },
  projects: [
    { name: "setup", testMatch: "**/auth.setup.ts" },
    {
      name: "chromium-auth",
      dependencies: ["setup"],
      testMatch: [
        "**/dashboard-button-audit.spec.ts",
        "**/sync-contract.spec.ts",
        "**/core-flow.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "chromium",
      testIgnore: [
        "**/auth.setup.ts",
        "**/dashboard-button-audit.spec.ts",
        "**/sync-contract.spec.ts",
        "**/core-flow.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer:
    process.env.CI || process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? undefined
      : {
          command: "bun run dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
        },
});
