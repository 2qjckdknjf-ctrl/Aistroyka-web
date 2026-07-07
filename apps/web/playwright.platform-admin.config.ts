import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const isCI = !!process.env.CI;
const outputDir = path.join(__dirname, "tests/platform-admin/.artifacts");

/** Chromium viewports (avoid WebKit-only device presets for CI chromium-only installs). */
const viewportMatrix = [
  {
    name: "desktop",
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1280, height: 720 },
    },
  },
  {
    name: "tablet",
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 834, height: 1194 },
    },
  },
  {
    name: "mobile",
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    },
  },
] as const;

const colorSchemes = ["light", "dark"] as const;

export default defineConfig({
  testDir: "./tests/platform-admin",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  outputDir,
  snapshotPathTemplate:
    "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}",
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "platform-admin-chromium",
      testMatch: ["**/accessibility.spec.ts", "**/golden-path.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    ...viewportMatrix.flatMap((viewport) =>
      colorSchemes.map((colorScheme) => ({
        name: `visual-${viewport.name}-${colorScheme}`,
        testMatch: ["**/visual-regression.spec.ts"],
        use: {
          ...viewport.use,
          colorScheme,
        },
      }))
    ),
  ],
  webServer:
    isCI || process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? undefined
      : {
          command: "bun run dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: !isCI,
          timeout: 300_000,
        },
});
