import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { requireE2eCredentials } from "./_helpers/auth";
import { e2eLocale } from "./_helpers/routes";

const authDir = path.join(__dirname, "_state");
const authFile = path.join(authDir, "auth.json");

setup("authenticate", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  const { email, password } = requireE2eCredentials();
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

  const login = await page.request.post(`${baseURL}/api/auth/login`, {
    data: { email, password, traceId: `e2e-setup-${Date.now()}` },
  });
  if (!login.ok()) {
    const body = await login.text().catch(() => "");
    throw new Error(`Auth setup login failed: ${login.status()} ${body.slice(0, 500)}`);
  }

  await page.goto(`${baseURL}/${e2eLocale}/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page).toHaveURL(new RegExp(`/${e2eLocale}/dashboard`));
  await page.context().storageState({ path: authFile });
});
