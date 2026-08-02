import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Phase 3B — authenticated dashboard + tenant-admin flows.
 * Run only after `node tests/phase3b/preflight.mjs` exits 0.
 * Do not use for public/portal/platform-admin suites.
 */

function loadRootPublicEnv(): Record<string, string> {
  const rootEnv = path.join(__dirname, "../../.env.local");
  const out: Record<string, string> = {};
  if (!existsSync(rootEnv)) return out;
  const text = readFileSync(rootEnv, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) out[key] = val;
  }
  return out;
}

const publicEnv = loadRootPublicEnv();

export default defineConfig({
  testDir: "./tests/phase3b",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      testIgnore: ["**/responsive-shell.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      testMatch: ["**/responsive-shell.spec.ts"],
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer:
    process.env.CI || process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? undefined
      : {
          command: "bun run dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
          timeout: 300_000,
          env: {
            ...process.env,
            ...publicEnv,
          },
        },
});