import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { requireE2eCredentials } from "../e2e/_helpers/auth";
import { e2eLocale } from "../e2e/_helpers/routes";

const authDir = path.join(__dirname, "../e2e/_state");
const authFile = path.join(authDir, "auth.json");

setup("authenticate for QA suite", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  let email: string;
  let password: string;
  try {
    ({ email, password } = requireE2eCredentials());
  } catch {
    setup.skip(true, "E2E_EMAIL/E2E_PASSWORD not set — auth-dependent QA specs will skip.");
    return;
  }

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? process.env.QA_BASE_URL ?? "http://localhost:3000";
  const login = await page.request.post(`${baseURL}/api/auth/login`, {
    data: { email, password, traceId: `qa-setup-${Date.now()}` },
  });
  if (!login.ok()) {
    const body = await login.text().catch(() => "");
    throw new Error(`QA auth setup failed: ${login.status()} ${body.slice(0, 500)}`);
  }

  await page.goto(`${baseURL}/${e2eLocale}/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page).toHaveURL(new RegExp(`/${e2eLocale}/dashboard`));
  await page.context().storageState({ path: authFile });
});
