import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value) out[key] = value;
  }
  return out;
}

const repoRoot = path.resolve(__dirname, "../..");
const envFromFiles = {
  ...loadEnvFile(path.join(__dirname, ".env.local")),
  ...loadEnvFile(path.join(repoRoot, ".env.local")),
  ...loadEnvFile(process.env.PHASE4_ENV_FILE || "/tmp/aistroyka-phase4-orch/phase4.env"),
};

for (const [key, value] of Object.entries(envFromFiles)) {
  if (!process.env[key]) process.env[key] = value;
}

const baseURL =
  process.env.PHASE4_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/phase4",
  testMatch: ["**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    extraHTTPHeaders: {
      "user-agent": "aistroyka-phase4-contracts",
    },
  },
  projects: [
    {
      name: "api-contracts",
    },
  ],
});
