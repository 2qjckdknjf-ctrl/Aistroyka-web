import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Phase 3A — credential-free public + auth-entry evidence (Chromium required).
 * Do not use this config for authenticated multi-role suites (3B–3E).
 *
 * Next.js loads env from apps/web; monorepo secrets often live in repo-root `.env.local`.
 * Pass through public NEXT_PUBLIC_* keys by name only (values never logged).
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
  testDir: "./tests/phase3a",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      testIgnore: ["**/responsive-viewports.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-responsive",
      testMatch: ["**/responsive-viewports.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer:
    process.env.CI || process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? undefined
      : {
          command: "bun run dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
          reuseExistingServer: false,
          timeout: 300_000,
          env: {
            ...process.env,
            ...publicEnv,
          },
        },
});
