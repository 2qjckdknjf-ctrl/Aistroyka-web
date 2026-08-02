import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, "tests/e2e/_state", "auth.json");
const qaOutputDir = process.env.QA_ARTIFACT_DIR
  ? path.join(process.env.QA_ARTIFACT_DIR, "playwright-output")
  : path.join(__dirname, "../../docs/qa/artifacts/latest/playwright-output");

const isCI = !!process.env.CI;
const retainArtifacts = !!process.env.QA_ARTIFACT_DIR || isCI;

/** Desktop + tablet + mobile matrix for QA platform (Phase 2 + 14). */
const deviceMatrix = [
  { name: "chrome-desktop", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
  { name: "safari-desktop", use: { ...devices["Desktop Safari"] } },
  { name: "edge-desktop", use: { ...devices["Desktop Edge"], channel: "msedge" } },
  { name: "ipad-portrait", use: { ...devices["iPad Pro 11"] } },
  { name: "ipad-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
  { name: "android-pixel", use: { ...devices["Pixel 7"] } },
  { name: "android-samsung", use: { ...devices["Galaxy S9+"] } },
  { name: "iphone-portrait", use: { ...devices["iPhone 14"] } },
  { name: "iphone-landscape", use: { ...devices["iPhone 14 landscape"] } },
];

export default defineConfig({
  testDir: "./tests/qa",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : 1,
  timeout: 90_000,
  outputDir: qaOutputDir,
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}",
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(path.dirname(qaOutputDir), "html-report"), open: "never" }],
    ["json", { outputFile: path.join(path.dirname(qaOutputDir), "results.json") }],
    ["junit", { outputFile: path.join(path.dirname(qaOutputDir), "junit.xml") }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? process.env.QA_BASE_URL ?? "http://localhost:3000",
    trace: retainArtifacts ? "retain-on-failure" : "on-first-retry",
    screenshot: retainArtifacts ? "only-on-failure" : "off",
    video: retainArtifacts ? "retain-on-failure" : "off",
  },
  projects: [
    { name: "setup", testMatch: "**/00-auth.setup.ts" },
    {
      name: "qa-chrome-auth",
      dependencies: ["setup"],
      testMatch: [
        "**/02-auth.spec.ts",
        "**/03-roles.spec.ts",
        "**/04-business-logic.spec.ts",
        "**/06-database-consistency.spec.ts",
        "**/07-ai-validation.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
    {
      name: "qa-chrome",
      testIgnore: ["**/00-auth.setup.ts"],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Multi-device runs: only public, design, accessibility (unauth or light scenarios)
    ...deviceMatrix
      .filter((d) => d.name !== "chrome-desktop")
      .map((d) => ({
        name: `qa-${d.name}`,
        testMatch: ["**/01-public-website.spec.ts", "**/08-design-responsive.spec.ts", "**/10-accessibility.spec.ts"],
        use: d.use,
      })),
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
