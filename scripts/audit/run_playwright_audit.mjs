import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const artifactDir = process.env.AUDIT_ARTIFACT_DIR ?? path.join(root, "docs/audit/artifacts/local");
fs.mkdirSync(artifactDir, { recursive: true });

const env = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
  PLAYWRIGHT_SKIP_WEB_SERVER: "1",
  PLAYWRIGHT_TEST_DIR: path.join(artifactDir, "playwright-test-results"),
  PLAYWRIGHT_HTML_REPORT: path.join(artifactDir, "playwright-report"),
};

const result = spawnSync(
  "npx",
  [
    "playwright",
    "test",
    "tests/e2e/audit-dashboard-smoke.spec.ts",
    "tests/e2e/audit-dashboard-navigation.spec.ts",
    "tests/e2e/audit-button-inventory.spec.ts",
    "--config=playwright.config.ts",
    "--output",
    env.PLAYWRIGHT_TEST_DIR,
    "--reporter=list,json",
  ],
  {
    cwd: path.join(root, "apps/web"),
    stdio: "inherit",
    env,
  }
);

process.exit(result.status ?? 1);
