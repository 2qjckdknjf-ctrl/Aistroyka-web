import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Phase 3D — required platform-admin / Operations Center proof.
 * Run only after `node tests/phase3d/preflight.mjs` exits 0.
 * No soft-skips; optional visual baselines live only under playwright.platform-admin.config.ts.
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
  testDir: "./tests/phase3d",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 240_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer:
    process.env.CI || process.env.PLAYWRIGHT_SKIP_WEB_SERVER
      ? undefined
      : {
          command: "bun run dev",
          url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
          timeout: 300_000,
          env: {
            ...process.env,
            ...publicEnv,
            ...(process.env.SUPABASE_SERVICE_ROLE_KEY
              ? {}
              : (() => {
                  const rootEnv = path.join(__dirname, "../../.env.local");
                  if (!existsSync(rootEnv)) return {};
                  for (const line of readFileSync(rootEnv, "utf8").split("\n")) {
                    const t = line.trim();
                    if (!t || t.startsWith("#") || !t.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) continue;
                    let v = t.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim();
                    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
                    return v ? { SUPABASE_SERVICE_ROLE_KEY: v } : {};
                  }
                  return {};
                })()),
          },
        },
});
